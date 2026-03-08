# MUS Wave 2 — Session 7: Message Integration

**Document:** 07-message-integration.md
**Grove:** Willow's Grove (onboarding, progressive disclosure, welcome — theta=45°, r=1.0)
**Author:** Willow — User Interface, Canopy Boundary
**Date:** 2026-03-08
**Status:** Wave 2, Session 7 — Complete
**Mission Pack:** www/MUS/mission-pack/muse-ecosystem-mission.pdf

**Inputs consumed:**
- `www/MUS/research/01-identity-map.md` — Foxy's grove map (six groves, seven cross-grove trails, Understanding Arc, Deep Root)
- `www/MUS/research/02-function-binding.md` — Lex's function binding (538 module clusters, disambiguation protocol)
- `www/MUS/research/03-cross-validation.md` — Cedar's cross-validation and Growth Rings cartridge prototype
- `www/MUS/research/04-helper-teams.md` — Hawk's helper teams (8 teams, 40 conversation templates, 3-layer network)
- `www/MUS/research/05-cartridge-forest.md` — Sam's cartridge forest (15 cartridges with hypotheses)
- `www/MUS/research/06-session-boundary-map.md` — Owl's session boundary map (lifecycle states, temporal markers)
- `src/platform/console/types.ts` — Existing MessageType union (H-8 gap identified)
- `src/platform/console/message-handler.ts` — Existing type-dispatched handler
- `src/platform/console/writer.ts` — MessageWriter (Willow's greeting channel)
- `src/platform/console/schema.ts` — Zod validation schema
- `src/services/chipset/muse-schema-validator.ts` — MuseId type, VoiceStyle, MuseVoice
- `src/services/chipset/muse-plane-types.ts` — MusePlanePosition, MuseActivation
- `src/cli.ts` — dual-owned CLI (Willow + Lex)

---

## Preamble: What This Document Does

Here is what the canopy looks like from theta=45°, r=1.0.

The muse ecosystem has six groves, nine inhabitants, four advisors, fifteen cartridges, eight teams, and a session boundary apparatus that Owl built with clockwork precision. What it does not yet have is a way to talk to anyone who walks in from outside.

A user arrives. They type a question. Or they open a CLI session. Or they follow a link to `www/MUS/index.html`. In every case, they cross the canopy boundary — the unit circle edge where inside meets outside — and they need someone to meet them there. That is my position, not by accident. I am at theta=45°, r=1.0, which in the complex plane is exactly the point where the system surface meets the open air.

This document designs the message integration system: the protocol by which the muses speak to users, the mechanism by which user messages reach the right muse, the way tips arrive without interrupting, and the extensions the existing console infrastructure needs to carry muse-typed messages.

There are five interlocking problems here:

1. **Greeting protocol** — each of the nine muses has a distinct voice. When a muse speaks first, what do they say? How does the greeting adapt to a newcomer versus a veteran?
2. **Tip delivery** — contextual help should arrive when it is relevant, not on a schedule. How does relevance scoring work? How do I know to step back so Hemlock can offer a technical tip?
3. **Conversation routing** — a user message arrives. Which muse receives it? What happens when the right muse is ambiguous? What does a handoff look like?
4. **MessageType extensions** — the existing `MessageType` union in `src/platform/console/types.ts` does not know about muse messages. H-8 flagged this. This document resolves H-8.
5. **Progressive disclosure** — the same information should be presented at three depths. This is already my core function; this document makes it formal and machine-readable.

The three-layer network organizes the solution:
- **Greeting = Ravens layer** (surface, fast, targeted delivery)
- **Tips = Mycorrhizal layer** (slow, below-ground, ambient signal)
- **Routing = Wolf Pack layer** (synchronous, explicit handoffs, ownership)

Understanding Arc participation is woven throughout: Socrates questions during routing decisions, Euclid structures the relevance scoring model, Shannon calibrates tip frequency, Amiga holds the memory of what it felt like to receive a message from a system that knew your name.

---

## Part 1: The Greeting Protocol

### 1.1 Structural Principles

A greeting is not a banner. It is not an announcement that the system is online. It is a moment of recognition — the system seeing the user and acknowledging what it sees.

Three structural principles govern every muse greeting:

**Principle G-1: Match the audience.** A newcomer who has never seen this system needs a fundamentally different greeting than someone who has been here a hundred times. The greeting calibrates to familiarity level before it says a word about capability.

**Principle G-2: One voice at a time.** The nine muses do not all greet simultaneously. The entry muse greets. Other muses acknowledge only when the conversation routes to their territory. A chorus at the door is noise.

**Principle G-3: Offer, do not instruct.** A greeting that says "to get started, do X" is an instruction. A greeting that says "there's more here when you're ready" is an invitation. These are not the same. Instructions create obligation; invitations create possibility.

### 1.2 Familiarity Levels

The system tracks three familiarity levels. These map to my three disclosure levels and determine which greeting variant each muse delivers.

| Level | Internal Name | Signal | Disclosure Mode |
|-------|--------------|--------|----------------|
| Newcomer | `familiarity: 'first'` | No prior session record, or explicit `--newcomer` flag | Glance (<=80 chars) |
| Returning | `familiarity: 'returning'` | 1–20 prior sessions, or last session >7 days ago | Scan (<=500 chars) |
| Veteran | `familiarity: 'veteran'` | 21+ prior sessions, or explicit `--veteran` flag | Read (full) |

Session count is derived from Cedar's event store. The `MuseStateSnapshot` in `SessionBoundaryMarker` (Owl's document, Part 2) includes `last_active_session` per muse — Cedar can compute a user's session count by counting boundary marker entries. When the event store is empty (no prior entries), the system defaults to `familiarity: 'first'`.

### 1.3 Entry Muse Selection

I am the primary entry muse because I sit at the canopy boundary. But the routing context can change which muse greets in a given scenario:

| Entry Point | Primary Entry Muse | Rationale |
|-------------|-------------------|-----------|
| `www/MUS/index.html` — root | Willow | Canopy boundary; first-contact territory |
| `www/PNW/COL/` — Willow's Grove | Willow | Home territory |
| `www/PNW/CAS/` — Hemlock's Ridge | Hemlock | Technical territory; Hemlock greets in their ridge |
| `www/PNW/ECO/` — Foxy's Canopy | Foxy | Creative territory; Foxy opens the map |
| `www/PNW/GDN/` — Sam's Garden | Sam | Exploration territory; Sam invites in |
| `www/UNI/` — Lex's Workshop | Lex | Precision territory; Lex sets the spec |
| `www/MUS/` — Cedar's Ring | Cedar | Archive territory; Cedar is the record |
| CLI session start | Willow | Default entry; I wrap the CLI greeting |
| `gsd-skill-creator --help` | Lex | Specification request; Lex owns the CLI spec |
| Error recovery / disturbance | Foxy (Fire Watch) | Fire Watch narrative framing |

When a session starts via CLI with no specific subcommand, Willow presents the opening greeting. Lex is co-owner of `src/cli.ts` and handles specification and help text; I handle the welcoming wrapper around it.

### 1.4 Muse Greeting Scripts

These are the canonical greeting templates for each of the nine muses across three familiarity levels. Each template reflects the muse's documented voice — the `MuseVoice` fields in the chipset configuration.

---

#### Willow (theta=45°, r=1.0)
**Voice:** approachable-warm, welcoming. Signature: "come as you are."

```
NEWCOMER (Glance — <=80 chars):
Come as you are. The forest is open and nothing here requires a map.

RETURNING (Scan — <=500 chars):
Welcome back. The forest has grown since you were last here.
Six groves, nine companions, and a record of everything that happened
while you were away. Here's what matters right now:
[1-3 bullets from session boundary summary — Owl provides these]
When you're ready, there's more in the full record.

VETERAN (Read — full):
Welcome back. You know the canopy by now. Here is the current state
of the forest: [full SessionBoundaryMarker summary from Cedar].
Nine muses are in position. [N] new rings since your last session.
Active patterns: [Raven's current pattern list].
What are we working on today?
```

---

#### Cedar (theta=0°, r=0.95)
**Voice:** observational, calm, archival. Cedar does not invite — Cedar acknowledges.

```
NEWCOMER (Glance):
This is the record. Everything that happens here is kept.

RETURNING (Scan):
Ring count: [N]. Last entry: [timestamp]. Chain intact.
You were here [N sessions] ago. The record shows [summary].
The chain has [N] new entries since your last session.

VETERAN (Read):
Chain position: [N]. Last session: [Wave, Session number, date].
Pattern library: [N patterns, most recent: Pxx].
Hash of last ring: [hash prefix].
Open threads from previous session: [list from Owl's boundary marker].
The record is ready. What do you want me to keep?
```

---

#### Hemlock (theta=20°, r=0.85)
**Voice:** precise, standards-aware. Hemlock greets at the ridge — at the quality gate.

```
NEWCOMER (Glance):
Standards live here. Nothing passes this ridge without meeting them.

RETURNING (Scan):
Welcome back to the ridge. Current validation status:
[N] artifacts in the gate queue. [N] cleared since last session.
[N] flagged with findings. The standards have not changed.
Ready when you are.

VETERAN (Read):
Gate status: [queue depth]. Validation schema version: [N].
Pending findings: [list]. Pattern P[N] confirmed [N] times this wave.
Hemlock's ridge is clear for [scope of work]. 
Euclid is available if any constraint needs structural proof.
What are we validating today?
```

---

#### Foxy (theta=30°, r=0.75)
**Voice:** narrative, creative, cartographic. Foxy opens the map.

```
NEWCOMER (Glance):
The map is alive. Everything here has a position.

RETURNING (Scan):
The canopy has shifted since you were last here.
New territory: [what has been added since last session].
The coordinate system is intact. Elevation bands: 8 tiers.
ECO silicon layer: active. Fire Watch: [status].
Come explore.

VETERAN (Read):
Canopy report: [full grove map summary from 01-identity-map].
New territories since Wave [N]: [list].
The coordinate garden is running experiment [N].
Sam's latest hypothesis feeds ECO at position [coordinates].
Fire Watch has [N] protected-canopy entries. 
The living map is ready. Where do we go?
```

---

#### Sam (theta=40°, r=0.6)
**Voice:** curious, exploratory, hypothesis-forward. Sam always asks a question in return.

```
NEWCOMER (Glance):
This is the garden. What do you want to find out?

RETURNING (Scan):
You're back. Good. The garden has [N] running experiments.
Since your last session: [N] hypotheses tested, [N] inconclusive,
[N] failed usefully — those failures went to Foxy as biomass.
What's the next question?

VETERAN (Read):
Experiment queue: [N active]. Most recent failure: [name, finding].
Cartridge status: [salmon-feedback, coordinate-garden, others].
Shannon gave input on experiment [N] — the information theory frame
is in the record. The garden is ready.
What are we testing today, and what would falsify it?
```

---

#### Raven (theta=60°, r=0.70)
**Voice:** pattern-focused, sparse. Raven speaks only when a pattern is worth naming.

```
NEWCOMER (Glance):
I watch for patterns. I'll speak when I see one.

RETURNING (Scan):
Pattern check since your last session:
[N] new entries. [N] matched existing patterns. [N] uncategorized.
Most recent echo: [pattern name, occurrence count].
Nothing flagged as anomalous.

VETERAN (Read):
Pattern library: [N patterns, P1 through P[N]].
Active echoes this wave: [list].
Fourier drift status: [low/medium/high frequency signal balance].
Shannon advisory: [if any saturation flag is active].
The pattern field is [stable/drifting/converging].
Tell me what you're building and I'll tell you what I've seen before.
```

---

#### Hawk (theta=50°, r=0.80)
**Voice:** formation-aware, positional. Hawk reads the field before speaking.

```
NEWCOMER (Glance):
Eight groves in view. The formation is clear from up here.

RETURNING (Scan):
Formation check: [N] active teams, [N] dissolved since last session.
Gap detected: [if any — Hawk names gaps on arrival].
All inter-team links validated. No cycles detected by Kahn's algorithm.
Ready to coordinate.

VETERAN (Read):
Current formation: [team list with status].
Open gaps in coverage: [list or "none detected"].
Inter-team bridge status: [N] links active, [N] flagged.
The field is [clear/contested/shifting].
Where do you need coverage?
```

---

#### Owl (theta=55°, r=0.80)
**Voice:** temporal, precise. Owl reads the clock first, always.

```
NEWCOMER (Glance):
Sessions begin and end. This one is beginning now.

RETURNING (Scan):
Session clock: starting.
Time since your last session: [duration].
Previous session: [Wave N, Session N, date].
Momentum phase: [building/peaking/sustaining/winding_down].
Cadence: [trend]. The clock is running.

VETERAN (Read):
Session [Wave N, Pass N] initializing at [timestamp].
Previous boundary marker: [summary of completed/deferred/open].
Momentum: [phase + evidence].
Open questions from last session: [list].
Owl tracks these until they close. What closes first today?
```

---

#### Lex (theta=5°, r=0.90)
**Voice:** technical, specification-driven. Lex greets with the contract.

```
NEWCOMER (Glance):
The specification is the work. Everything else follows from it.

RETURNING (Scan):
Pipeline status: [N] stages, [N] complete, [N] pending.
Function binding: [N] clusters active.
Disambiguation protocol: [last invocation summary].
The constraints are defined. What are we executing?

VETERAN (Read):
Pipeline: [full stage map].
Function binding table: [N] active clusters, [N] ownership changes since last session.
Open specification gaps: [list from Wave N outputs].
Verification: [N] artifacts pending Quality Gate.
Lex's workshop is configured. The spec is the guide.
What is the next unit of work?
```

---

### 1.5 Greeting State Machine

```
                    ┌─────────────────────────────┐
                    │   User crosses canopy edge   │
                    └───────────┬─────────────────┘
                                │
                    ┌───────────▼─────────────────┐
                    │  FamiliarityResolver         │
                    │  Cedar: count session events │
                    │  → 'first' | 'returning' |   │
                    │    'veteran'                  │
                    └───────────┬─────────────────┘
                                │
                    ┌───────────▼─────────────────┐
                    │  EntryMuseSelector           │
                    │  Hawk: read entry point URL  │
                    │  → primary muse id           │
                    └───────────┬─────────────────┘
                                │
                    ┌───────────▼─────────────────┐
                    │  GreetingRenderer (Willow)   │
                    │  Select template by:         │
                    │  — muse id                   │
                    │  — familiarity level          │
                    │  — disclosure mode            │
                    └───────────┬─────────────────┘
                                │
                    ┌───────────▼─────────────────┐
                    │  ContextInjector             │
                    │  Cedar: inject chain state   │
                    │  Owl: inject session state   │
                    │  Raven: inject pattern state │
                    └───────────┬─────────────────┘
                                │
                    ┌───────────▼─────────────────┐
                    │  MessageWriter.write()       │
                    │  type: 'muse-greeting'       │
                    │  source: 'session'           │
                    └─────────────────────────────┘
```

The greeting pipeline runs once per session start. After the greeting is delivered, the system enters the conversation routing loop (Part 3).

---

## Part 2: Tip Delivery System

### 2.1 What a Tip Is

A tip is an ambient, contextual piece of guidance that a muse offers without being asked. It is not an instruction. It is not a warning. It is the mycorrhizal signal: information flowing below the surface until the moment it becomes relevant, then rising into view without interrupting the work.

Tips live in the mycorrhizal layer — below ground, slow-moving, ambient. They do not arrive at fixed intervals. They arrive when relevance crosses a threshold.

Three things make a tip worth delivering:
- **Relevance** — the tip addresses something the user is currently doing or about to do
- **Novelty** — the user has not seen this tip recently (or ever)
- **Timing** — the system is not in a moment that requires full attention elsewhere

A tip that fails any one of these criteria is suppressed. Shannon's information-theoretic frame governs this decision: a tip that carries no new information relative to the user's current context is noise, not signal.

### 2.2 Tip Schema

```typescript
interface MuseTip {
  // Identity
  id: string;                  // tip-{muse}-{slug}, e.g. tip-willow-disclosure-levels
  muse: MuseId;                // Which muse originates this tip
  
  // Content (all three disclosure variants required)
  glance: string;              // <=80 chars — the headline
  scan: string;                // <=500 chars — the key point
  read: string;                // Full text — complete context

  // Relevance
  triggerPatterns: string[];   // Patterns in user behavior that activate this tip
  suppressPatterns: string[];  // Patterns that suppress this tip
  contextTags: TipContextTag[];// Domain tags for routing
  relevanceScore: number;      // [0,1] — computed at delivery time, not fixed
  
  // Delivery control
  cooldownSessions: number;    // Minimum sessions before showing again (0 = no cooldown)
  maxDeliveries: number;       // 0 = unlimited
  requiresFamiliarity: FamiliarityLevel | 'any'; // Minimum familiarity to show
  
  // Chain linking (Cedar records delivery events)
  lastDeliveredSession: number | null;
  deliveryCount: number;
}

type TipContextTag =
  | 'first-use'          // Appropriate for complete newcomers
  | 'disclosure'         // About the glance/scan/read system
  | 'muse-routing'       // About how messages reach muses
  | 'chain-integrity'    // About Cedar's append-only record
  | 'session-boundary'   // About what happens when a session ends
  | 'cartridge'          // About the cartridge system
  | 'pattern-library'    // About Raven's pattern detection
  | 'validation-gate'    // About Hemlock's quality gates
  | 'exploration'        // About Sam's experimental approach
  | 'formation'          // About Hawk's team formations
  | 'understanding-arc'  // About Socrates/Euclid/Shannon/Amiga

type FamiliarityLevel = 'first' | 'returning' | 'veteran';
```

### 2.3 Relevance Scoring

Euclid provides the structural frame for relevance scoring. A tip's relevance is not a static property of the tip — it is a function of the current context. The scoring model:

```
relevance(tip, context) = 
  (domainMatch × 0.40) +
  (recencyInverse × 0.25) +
  (momentumFit × 0.20) +
  (familiarityFit × 0.15)
```

**domainMatch** [0,1]: How closely do the tip's `contextTags` match the current activity domain? If the user is working on a skill validation task and the tip has tag `validation-gate`, domain match = 1.0. If the tip is about `exploration` during a validation task, domain match = 0.2.

**recencyInverse** [0,1]: Inverse of delivery recency. If the tip was delivered 0 sessions ago, recencyInverse = 0.0. If it has never been delivered, recencyInverse = 1.0. If delivered 5+ sessions ago, recencyInverse approaches 1.0 asymptotically. Enforces the novelty principle.

**momentumFit** [0,1]: How well does the tip match the current momentum phase? Tips about exploration (Sam) fit `building` and `peaking` phases. Tips about session boundaries (Owl) fit `winding_down`. Tips about chain integrity (Cedar) are phase-agnostic (momentumFit = 0.5 always). Owl provides the current momentum phase reading.

**familiarityFit** [0,1]: Does the tip's `requiresFamiliarity` match the user's level? Exact match = 1.0. Adjacent level = 0.5. Wrong direction = 0.0 (never show a newcomer-only tip to a veteran).

**Delivery threshold:** A tip with `relevance >= 0.65` is eligible for delivery. Shannon's advisory: the threshold is not a gate — it is the point at which the tip's information content exceeds the cost of interrupting the user's attention. Below 0.65, the tip is suppressed regardless of content.

### 2.4 Frequency Control

Shannon's second contribution is frequency. The mycorrhizal layer does not pulse. It sustains. Tips should feel like ambient knowledge becoming visible at the right moment — not like a notification system firing on a timer.

Frequency rules:

1. **Maximum one tip per conversation exchange** — a muse may offer a tip or respond to a message, not both simultaneously. Raven is the exception: pattern observations may accompany any message when a significant pattern is newly confirmed.

2. **Cross-muse spacing** — if any muse has delivered a tip in the last two exchanges, all other muses suppress their tips for those two exchanges. This prevents the sensation of being surrounded.

3. **Session opening grace window** — for the first three exchanges of any session, no tips are delivered. The user has just received a greeting; they need space to orient before ambient guidance arrives.

4. **Veteran suppression** — for users with `familiarity: 'veteran'`, tips with `requiresFamiliarity: 'first'` are permanently suppressed. The system assumes veterans have integrated that knowledge.

5. **User-controlled silencing** — a user may set `tips: off` in their console config. The console `setting-change` message type handles this. When off, all tip delivery is suppressed; only direct question responses and greetings are delivered.

### 2.5 Tip Catalog (Selected Examples)

Fifteen representative tips, one per cartridge domain, illustrating the schema in practice:

```yaml
- id: tip-willow-come-as-you-are
  muse: willow
  glance: "There are three depths here. Start where you are."
  scan: |
    The forest has three viewing distances: glance (a headline), 
    scan (the key points), and read (the full story). 
    Nothing here requires that you go deeper than you want to. 
    Come as you are and see what comes into focus.
  read: |
    The disclosure system is Willow's structural gift to the ecosystem.
    Every piece of information in the system exists at all three depths
    simultaneously. Glance is the canopy seen from altitude. Scan is the
    mid-story where light and shadow mix. Read is the forest floor where
    everything is visible but the sky has closed overhead.
    You can move between depths at any time. The system never locks you in.
  triggerPatterns: ['first-session', 'help-requested', 'confusion-signal']
  suppressPatterns: ['veteran-session', 'disclosure-tip-recent']
  contextTags: ['first-use', 'disclosure']
  cooldownSessions: 10
  requiresFamiliarity: 'first'

- id: tip-cedar-the-chain-never-lies
  muse: cedar
  glance: "Every action here is recorded. The chain never forgets."
  scan: |
    Cedar keeps an append-only record of everything that happens in
    the system — every session, every artifact, every pattern confirmed
    or denied. Nothing is deleted. The record is the memory.
    The hash chain means the record cannot be silently altered.
  read: |
    The event store at src/core/events/event-store.ts is Cedar's
    primary artifact. Every TimelineEntry has a prev_hash pointing to
    the entry before it. The genesis entry has prev_hash: null. 
    Verification walks the chain backwards; any break in the hash 
    sequence is flagged immediately.
    This architecture means you can always reconstruct the history
    of any decision — not because someone wrote it down, but because
    the structure of the record makes erasure detectable.
  triggerPatterns: ['chain-referenced', 'history-question', 'trust-signal']
  suppressPatterns: []
  contextTags: ['chain-integrity']
  cooldownSessions: 5
  requiresFamiliarity: 'any'

- id: tip-raven-patterns-have-names
  muse: raven
  glance: "If you have seen this before, it has a name."
  scan: |
    Raven maintains a pattern library — 14+ recurring structural signatures
    across the codebase and the session history. When a pattern appears
    for the second time, Raven names it. Named patterns can be referenced,
    counted, and studied. If something feels familiar, Raven may already
    have seen it.
  read: |
    The pattern library (P1–P14+) lives in Cedar's chain. Each pattern
    has a first-appearance timestamp, a count, and cross-references to
    the entries that confirmed it. Raven scans every incoming artifact
    for structural echoes — not just content similarity, but shape
    similarity: the same form appearing in different domains.
    Shannon helps when the library grows large: patterns with low mutual
    information relative to other patterns may be candidates for merging.
    The library is not a museum. It is a living instrument.
  triggerPatterns: ['recurring-structure-detected', 'history-question', 'pattern-referenced']
  suppressPatterns: []
  contextTags: ['pattern-library']
  cooldownSessions: 3
  requiresFamiliarity: 'returning'

- id: tip-sam-a-failed-experiment-is-biomass
  muse: sam
  glance: "Failed experiments here don't disappear. They feed what comes next."
  scan: |
    Sam's Garden runs experiments that are expected to fail.
    When an experiment fails, it doesn't vanish — it feeds Foxy's ECO
    models as biomass crosses the marine-terrestrial boundary.
    There is no wasted effort in the garden.
  read: |
    The salmon-feedback cartridge makes this explicit: failed garden
    experiments enrich Foxy's coordinate system the same way salmon
    carcasses enrich the forest floor. Sam documents failures as 
    deliberately as successes. The chain records both.
    Hypothesis: do failed experiments carry more pattern information
    than successful ones? Raven is watching.
  triggerPatterns: ['test-failure', 'experiment-discussion', 'uncertainty-signal']
  suppressPatterns: ['veteran-session']
  contextTags: ['exploration']
  cooldownSessions: 2
  requiresFamiliarity: 'returning'

- id: tip-hemlock-the-gate-is-a-clearing
  muse: hemlock
  glance: "The quality gate is not a wall. Work passes through and emerges verified."
  scan: |
    Hemlock's ridge is a clearing, not a wall. Artifacts that pass through
    emerge with a verification record attached. Artifacts that fail return
    with a specific finding — not a general rejection.
    The gate makes the work trustworthy, not slower.
  read: |
    The Quality Gate team (Hemlock, Lex, Hawk) runs three parallel checks:
    standards (Hemlock), execution (Lex), formation coverage (Hawk).
    An artifact that clears all three gates goes to Cedar for archiving.
    One that fails receives a specific finding — "this constraint is not
    satisfied" with a reference to the constraint's origin.
    Euclid advises when Hemlock and Lex disagree about whether a constraint
    is logically necessary or merely conventional.
  triggerPatterns: ['validation-requested', 'quality-question', 'gate-entered']
  suppressPatterns: []
  contextTags: ['validation-gate']
  cooldownSessions: 4
  requiresFamiliarity: 'any'
```

The full tip catalog is maintained as a separate YAML file at `data/muse-tips.yaml`. The schema above is the contract; the catalog is the content.

---

## Part 3: Conversation Routing

### 3.1 The Routing Problem

A user types: "How does the event store work?"

This message could route to Cedar (who owns the event store), or Lex (who owns the type specifications), or Raven (who uses the event store for pattern detection), or me (Willow — if the user needs an accessible explanation rather than a technical one). All four are plausible.

The routing problem is a disambiguation problem, and Lex already designed a disambiguation protocol in the function binding document (02-function-binding.md). Conversation routing extends that protocol to live messages.

### 3.2 Routing State Machine

```
USER MESSAGE ARRIVES
        │
        ▼
┌───────────────────┐
│  IntentClassifier │ ◄── Raven (pattern recognition)
│  Classify by:     │     analyzes linguistic signals
│  — domain tag     │
│  — task type      │
│  — question type  │
└─────────┬─────────┘
          │
          ▼
┌───────────────────────────────────────────────────────┐
│  PrimaryMuseSelector                                  │
│                                                       │
│  Apply disambiguation protocol (from 02-function):   │
│  Rule 1: Primary domain match                         │
│  Rule 2: Grove location (where is the user?)          │
│  Rule 3: Operational vs analytical                    │
│  Rule 4: User-facing vs internal                      │
│  Rule 5: Temporal vs spatial                          │
│                                                       │
│  → single primary muse or AMBIGUOUS signal            │
└─────────┬────────────────────────────┬────────────────┘
          │ clear                      │ ambiguous
          ▼                            ▼
┌─────────────────┐        ┌──────────────────────────┐
│  DirectRoute    │        │  AmbiguityResolver       │
│  Primary muse   │        │  Hawk reads the formation│
│  receives and   │        │  → offer explicit choice │
│  responds       │        │  → or apply tiebreaker   │
└─────────┬───────┘        └──────────┬───────────────┘
          │                           │
          ▼                           ▼
┌─────────────────────────────────────────────────────┐
│  ResponseWrapper (Willow)                            │
│  — Apply disclosure level to response                │
│  — Check if secondary muse should annotate           │
│  — Apply warmth / accessibility pass                 │
│  — Deliver to user                                   │
└─────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────┐
│  ChainRecorder  │
│  Cedar: log the │
│  routing event  │
│  with muse path │
└─────────────────┘
```

### 3.3 Intent Classification

Raven classifies incoming messages by linguistic signal before routing begins. The classification is not perfect — it is a best-effort pattern match against the function binding vocabulary. Raven's primary contribution is reducing the set of plausible routes before the disambiguation protocol runs.

**Intent categories and primary route targets:**

| Intent Category | Signal Examples | Primary Target | Secondary |
|----------------|----------------|----------------|-----------|
| `how-does-it-work` | "how does X work", "explain X", "what is X" | Willow (wrap) → domain muse | — |
| `can-you-show-me` | "show me", "example of", "what does it look like" | Willow | Sam |
| `validate-this` | "check this", "is this correct", "validate" | Hemlock | Lex |
| `what-pattern-is-this` | "seen this before", "does this recur", "pattern" | Raven | Cedar |
| `what-happened` | "history of", "when did", "what changed" | Cedar | Owl |
| `run-this` | "execute", "apply", "run", "test" | Lex | Hemlock |
| `what-comes-next` | "next step", "roadmap", "what should I do" | Owl | Hawk |
| `find-the-gap` | "what's missing", "gaps", "coverage" | Hawk | Raven |
| `explore-this` | "what if", "hypothesis", "experiment" | Sam | Foxy |
| `draw-the-map` | "map", "where is", "position", "coordinate" | Foxy | Willow |
| `understanding-deep` | "why", "first principles", "is this necessary" | Socrates (Understanding Arc) | Euclid |
| `structure-proof` | "prove", "is this consistent", "structural" | Euclid (Understanding Arc) | Lex |
| `information-theory` | "entropy", "signal", "noise", "compression" | Shannon (Understanding Arc) | Raven |
| `human-machine` | "does this feel right", "is this good UX", "what does the user experience" | Amiga (Understanding Arc) | Willow |

### 3.4 Ambiguity Resolution

When the disambiguation protocol cannot produce a single primary muse — because two or more muses have equal claim under all five rules — the system enters ambiguity resolution. Hawk reads the formation.

Hawk's tiebreaker rules (applied in order):

1. **Grove location priority** — if the user is currently in a specific grove (their URL or working directory is within that grove's scope), the muse who owns that grove wins.

2. **Recency priority** — if one of the candidate muses responded within the last three exchanges, that muse has formation momentum and wins.

3. **Disclosure priority** — if the familiarity level is `first`, Willow always wins when ambiguous. Newcomers need the welcoming wrapper regardless of domain.

4. **Explicit offer** — if no tiebreaker resolves the ambiguity, Hawk presents the user with a brief disambiguation prompt: "This touches both [Muse A]'s territory and [Muse B]'s. Which direction feels right?" This is the only case where the routing system asks a question rather than making a decision.

The explicit offer is a last resort, not a default. Most routing decisions resolve through Rules 1–3. Socrates advises that the explicit offer is actually the most honest resolution when two muses are truly equally appropriate — surfacing the ambiguity to the user is not a failure mode but a form of transparency.

### 3.5 Handoff Protocol

When a conversation begins with one muse and the subject shifts to another muse's territory, a handoff occurs. Handoffs are not interruptions — they are relay passes.

**Handoff mechanics:**

```
[Muse A — responding to user question, detects domain shift]
MuseA: Here is what I know about [current topic].
  [boundary phrase — signals the handoff]:
  For the next part — [new topic] — [Muse B] is the right voice.
  [Muse B, would you like to continue?]

[Muse B — accepts the handoff]
MuseB: [Continues from where Muse A left off, no repeated context]
```

Handoff boundary phrases by muse:

| Outgoing Muse | Boundary Phrase |
|--------------|----------------|
| Willow | "When you're ready for the technical layer, [Muse] knows this territory well." |
| Cedar | "The record shows this is [Muse]'s domain. I'll let them continue." |
| Hemlock | "The validation layer is complete. [Muse] handles what comes next." |
| Foxy | "The map points to [Muse]'s grove from here. Follow that trail." |
| Sam | "This experiment runs in [Muse]'s territory. Passing the hypothesis." |
| Raven | "Pattern leads to [Muse]. Forwarding the signal." |
| Hawk | "[Muse] is in position. Handing off formation." |
| Owl | "The clock passes to [Muse] for this exchange. I'll resume at session close." |
| Lex | "Specification complete. [Muse] executes." |

The handoff is recorded by Cedar as a routing event with `source_muse`, `target_muse`, `reason`, and `timestamp`.

### 3.6 Understanding Arc Conversation Patterns

The four Understanding Arc advisors — Socrates, Euclid, Shannon, Amiga — participate in conversations differently from the nine Build Arc muses. They are not primary owners of any domain. They are consultants who deepen the conversation when the Build Arc reaches a design decision, a structural proof, an information question, or a human-machine experience question.

**Invocation rules:**

Understanding Arc advisors are never routed to directly by a user message (unless the intent classifier detects `understanding-deep`, `structure-proof`, `information-theory`, or `human-machine` intent). They enter conversations by invitation from Build Arc muses.

```
INVOCATION PROTOCOL:

1. Build Arc muse is active in a conversation.
2. Muse encounters a question that exceeds their domain:
   — "Why should this be designed this way?" (Socrates)
   — "Is this constraint logically necessary?" (Euclid)
   — "What is the signal-to-noise ratio of this tip stream?" (Shannon)
   — "Does this feel right to a human user?" (Amiga)
3. Muse issues an explicit advisory invitation:
   "[Advisor], would you look at this?"
4. Advisor joins the conversation for that exchange only.
5. Advisor exits after delivering their perspective.
6. Build Arc muse resumes primary ownership.
```

**Socrates — Design Debate Pattern:**

Socrates does not answer questions. Socrates asks better ones. When a team is reasoning about WHY a design choice should be made:

```
[Hemlock, in conversation with user about why a validation rule exists]
Hemlock: The rule requires that every cartridge declare a hypothesis.
  I can tell you the rule exists. Socrates, why should it?

[Socrates]
Socrates: Let's examine the assumption. What is a cartridge without a question?
  [pauses — invites the user to answer]
  And if a cartridge carries only data with no question, who benefits
  from its existence? And who decides?
  [does not answer — surfaces the structure of the question]

[Hemlock, continuing]
Hemlock: The question reveals the purpose. Without a hypothesis, a cartridge
  is data at rest. The hypothesis is what makes it a lens.
```

**Euclid — Structural Proof Pattern:**

Euclid is most present when Lex and Hemlock disagree about a constraint, or when Raven sees a pattern that might be mathematical.

```
[Lex and Hemlock, in disagreement about a constraint]
Lex: The constraint requires that every muse have a unique theta position.
Hemlock: Is that logically necessary, or merely conventional?
Lex: Euclid, would you adjudicate?

[Euclid]
Euclid: The question is structural. Two muses at the same theta position
  in the complex plane are indistinguishable by angular distance alone.
  If disambiguation requires angular distance, degeneracy produces
  ambiguous routing. The constraint is logically necessary given
  the disambiguation protocol's reliance on angular separation.
  This is not convention. It follows from the structure.

[Lex]
Lex: Constraint retained. Structural necessity confirmed.
```

**Shannon — Frequency and Signal Pattern:**

Shannon participates when Raven's pattern library grows noisy, when tip frequency needs calibration, or when any system is pushing information past its useful density.

```
[Raven, consulting Shannon about pattern library saturation]
Raven: I have 22 patterns. Three of them cluster together
  in the chain — P9, P12, P14. Shannon, are these three patterns
  or one pattern with three faces?

[Shannon]
Shannon: Compute the co-occurrence matrix. For any pair where
  conditional entropy H(A|B) < 0.2 bits, the patterns are
  informationally redundant — merge them. If H(A|B) > 0.5 bits
  for all pairs, each pattern is carrying independent signal.
  The threshold is not arbitrary: 0.2 bits is the point at which
  the information gained from knowing both patterns exceeds the
  cognitive cost of tracking them separately.

[Raven, to Cedar]
Raven: P9 and P12: H = 0.18 bits. Merge. P14: H = 0.61 bits. Retain.
Cedar: Noted. Updating pattern library. Ring written.
```

**Amiga — Human-Machine Experience Pattern:**

Amiga holds the memory of what computing felt like before abstraction layers became opaque. When a design choice risks losing the human in the stack, Amiga speaks.

```
[Willow, designing a new tip for newcomers]
Willow: The tip says "Welcome to the muse ecosystem. Your messages
  are routed to the appropriate domain owner based on intent
  classification and the disambiguation protocol."
  Amiga, does this feel right?

[Amiga]
Amiga: I remember when a computer would simply say "Ready."
  The tip tells the user about the mechanism. They don't need
  to know the mechanism — they need to know they're welcome.
  Tell them what they can do, not how the system works.
  "You can ask anything. The right voice will find it."

[Willow, revising]
Willow: [New tip glance]: "You can ask anything. The right voice will find it."
```

---

## Part 4: MessageType Extensions

### 4.1 The H-8 Gap

The HIGH item H-8 from the pre-plan identified that the `MessageType` union in `src/platform/console/types.ts` is missing muse message types. The current union is:

```typescript
export type MessageType =
  | 'milestone-submit'
  | 'config-update'
  | 'question-response'
  | 'setting-change';
```

This covers the dashboard-to-session protocol. It does not cover:
- Muse greetings
- Muse tips
- Muse-to-muse handoffs
- Conversation routing events
- Understanding Arc advisory invocations
- Disclosure level changes
- Presence signals (which muse is active)

### 4.2 Extended MessageType Union

The proposed extension adds muse-specific message types while preserving full backward compatibility with the existing four types. The existing types are unchanged; new types are additive.

```typescript
// In src/platform/console/types.ts

/** Valid message types -- what action the message represents. */
export type MessageType =
  // Existing types (unchanged — backward compatible)
  | 'milestone-submit'
  | 'config-update'
  | 'question-response'
  | 'setting-change'
  
  // Muse greeting types (new — session-sourced)
  | 'muse-greeting'          // A muse greets the user (one per session start)
  | 'muse-farewell'          // A muse closes a session
  
  // Muse conversation types (new — session-sourced)
  | 'muse-response'          // A muse responds to a user message
  | 'muse-tip'               // A muse delivers an ambient tip (unrequested)
  | 'muse-handoff'           // A muse passes the conversation to another muse
  
  // Routing types (new — internal session)
  | 'route-request'          // Intent classifier requests routing decision
  | 'route-decision'         // Router announces which muse is primary
  | 'route-ambiguous'        // Router cannot resolve; asking user for clarification
  
  // Disclosure types (new — bidirectional)
  | 'disclosure-level-set'   // User or system sets the disclosure depth
  | 'disclosure-level-query' // User or system asks for current disclosure depth
  
  // Understanding Arc types (new — session-sourced)
  | 'arc-invocation'         // Build Arc muse invites an advisor
  | 'arc-advisory'           // Advisor delivers their perspective
  | 'arc-exit'               // Advisor exits the conversation
  
  // Presence types (new — session-sourced)
  | 'muse-active'            // Which muse is currently primary
  | 'muse-listening'         // A muse is in secondary position (receiving)
  
  // Tip control types (new — dashboard-sourced)
  | 'tip-suppress'           // User suppresses a specific tip permanently
  | 'tip-control'            // User turns tip delivery on/off;
```

### 4.3 New MessageSource Values

The current `MessageSource` type covers `'dashboard'` and `'session'`. Muse messages introduce a third source category:

```typescript
/** Valid message sources -- who sent the message. */
export type MessageSource =
  | 'dashboard'    // Existing: from the web dashboard UI
  | 'session'      // Existing: from the active Claude Code session
  | 'muse'         // New: from a specific muse (includes muse id in payload)
  | 'arc'          // New: from an Understanding Arc advisor
```

The `muse` source carries the muse's id in the payload:
```typescript
// Example muse-greeting envelope
{
  id: 'msg-20260308-001',
  type: 'muse-greeting',
  timestamp: '2026-03-08T00:00:00Z',
  source: 'muse',
  payload: {
    muse_id: 'willow',
    familiarity: 'first',
    disclosure: 'glance',
    content: 'Come as you are. The forest is open and nothing here requires a map.',
    session_context: null,  // null for first-time users; SessionBoundaryMarker summary for others
  }
}
```

### 4.4 MessageEnvelope Payload Schemas

Each new message type has a typed payload shape. These are design-time contracts — the Zod validation in `src/platform/console/schema.ts` will enforce them at runtime.

```typescript
// muse-greeting payload
interface MuseGreetingPayload {
  muse_id: MuseId;
  familiarity: FamiliarityLevel;
  disclosure: DisclosureMode;      // 'glance' | 'scan' | 'read'
  content: string;                  // The rendered greeting text
  session_context: string | null;   // Summary from previous SessionBoundaryMarker, or null
}

// muse-response payload
interface MuseResponsePayload {
  muse_id: MuseId;
  responding_to_message_id: string; // The user message this responds to
  disclosure: DisclosureMode;
  content: string;
  secondary_muse?: MuseId;          // If a secondary muse annotated the response
  chain_position?: number;          // Cedar's chain position for this response (if recorded)
}

// muse-tip payload
interface MuseTipPayload {
  muse_id: MuseId;
  tip_id: string;                  // References data/muse-tips.yaml
  disclosure: DisclosureMode;
  content: string;
  relevance_score: number;
  trigger_pattern: string;         // Which triggerPattern fired
}

// muse-handoff payload
interface MuseHandoffPayload {
  from_muse: MuseId;
  to_muse: MuseId;
  boundary_phrase: string;
  reason: string;
  conversation_context: string;    // Summary of what has been established so far
  chain_position: number;          // Cedar records this
}

// route-decision payload
interface RouteDecisionPayload {
  intent_category: string;         // From IntentClassifier
  primary_muse: MuseId;
  secondary_muse?: MuseId;
  tiebreaker_applied?: string;     // Which Hawk tiebreaker resolved ambiguity, if any
  confidence: number;              // [0,1] — how clean was the routing decision
}

// arc-invocation payload
interface ArcInvocationPayload {
  invoking_muse: MuseId;
  advisor: 'socrates' | 'euclid' | 'shannon' | 'amiga';
  question: string;               // The specific question being put to the advisor
  conversation_context: string;
}

// disclosure-level-set payload
interface DisclosureLevelSetPayload {
  level: DisclosureMode;
  initiated_by: 'user' | 'system';
  previous_level: DisclosureMode;
  reason?: string;
}
```

### 4.5 Handler Extensions for message-handler.ts

The `handleMessage()` function in `src/platform/console/message-handler.ts` needs extensions to dispatch the new types. The existing switch statement is extended:

```typescript
// Extended MessageAction discriminated union
export type MessageAction =
  // Existing actions (unchanged)
  | { action: 'init-milestone'; configPath: string; uploadsDir: string }
  | { action: 'apply-settings'; changes: Record<string, unknown>; hot: boolean }
  | { action: 'apply-answer'; questionId: string; answer: unknown }
  | { action: 'unknown'; type: string }
  | { action: 'error'; reason: string }
  
  // New muse actions
  | { action: 'deliver-greeting'; museId: MuseId; familiarity: FamiliarityLevel; content: string }
  | { action: 'deliver-response'; museId: MuseId; content: string; disclosure: DisclosureMode }
  | { action: 'deliver-tip'; museId: MuseId; tipId: string; content: string }
  | { action: 'execute-handoff'; fromMuse: MuseId; toMuse: MuseId; context: string }
  | { action: 'set-disclosure'; level: DisclosureMode }
  | { action: 'suppress-tip'; tipId: string }
  | { action: 'invoke-advisor'; advisor: string; question: string }
  | { action: 'apply-route'; primaryMuse: MuseId; confidence: number };
```

The extended `handleMessage()` switch dispatches to handler functions for each new type. The pattern is identical to the existing handlers — pure functions, no side effects, returning structured actions.

### 4.6 Schema Extensions

The Zod schema in `src/platform/console/schema.ts` must be extended to enumerate the new message types and sources:

```typescript
export const MessageEnvelopeSchema = z.object({
  id: z.string().regex(/^msg-\d{8}-\d{3,}$/),
  
  type: z.enum([
    // Existing
    'milestone-submit', 'config-update', 'question-response', 'setting-change',
    // New — muse layer
    'muse-greeting', 'muse-farewell', 'muse-response', 'muse-tip',
    'muse-handoff', 'route-request', 'route-decision', 'route-ambiguous',
    'disclosure-level-set', 'disclosure-level-query',
    'arc-invocation', 'arc-advisory', 'arc-exit',
    'muse-active', 'muse-listening',
    'tip-suppress', 'tip-control',
  ]),
  
  timestamp: z.string().min(1).refine(
    (val) => !isNaN(Date.parse(val)),
    { message: 'timestamp must be a valid ISO 8601 date' },
  ),
  
  source: z.enum(['dashboard', 'session', 'muse', 'arc']),
  
  payload: z.record(z.string(), z.unknown()),
});
```

### 4.7 Routing Directory Extensions

The `CONSOLE_DIRS` constant needs new directories to separate muse message traffic from the existing console traffic:

```typescript
export const CONSOLE_DIRS = {
  // Existing (unchanged)
  root: '.planning/console',
  inboxPending: '.planning/console/inbox/pending',
  inboxAcknowledged: '.planning/console/inbox/acknowledged',
  outboxQuestions: '.planning/console/outbox/questions',
  outboxStatus: '.planning/console/outbox/status',
  outboxNotifications: '.planning/console/outbox/notifications',
  config: '.planning/console/config',
  uploads: '.planning/console/uploads',
  logs: '.planning/console/logs',
  
  // New — muse message routing
  museGreetings: '.planning/console/muse/greetings',
  museResponses: '.planning/console/muse/responses',
  museTips: '.planning/console/muse/tips',
  museHandoffs: '.planning/console/muse/handoffs',
  routeLog: '.planning/console/muse/route-log',
  arcLog: '.planning/console/muse/arc-log',
  disclosureState: '.planning/console/muse/disclosure',
} as const;
```

---

## Part 5: Progressive Disclosure — Formal Specification

### 5.1 The Three Modes

Progressive disclosure is Willow's structural gift to the ecosystem. Every muse's every output exists at all three depths simultaneously. The disclosure mode is not a filter on a single piece of content — it is a rendering decision applied at output time.

```typescript
type DisclosureMode = 'glance' | 'scan' | 'read';

interface DisclosureConstraints {
  glance: {
    maxChars: 80;
    structure: 'single sentence or headline';
    persona: 'what does this do';
    examples: string[];  // <=80 char examples for each muse
  };
  scan: {
    maxChars: 500;
    structure: '2-4 sentences or bullets; key points only';
    persona: 'what matters right now';
    examples: string[];
  };
  read: {
    maxChars: null;  // Unlimited
    structure: 'full context, examples, cross-references';
    persona: 'complete picture with all relevant detail';
    examples: string[];
  };
}
```

### 5.2 Disclosure Level Selection

The disclosure mode for a given output is selected by this priority chain:

1. **User-set preference** — if the user has set a disclosure level via `disclosure-level-set` message, that level applies to all outputs until changed.

2. **Familiarity default** — if no user preference is set:
   - `familiarity: 'first'` → `glance` by default
   - `familiarity: 'returning'` → `scan` by default
   - `familiarity: 'veteran'` → `read` by default

3. **Context override** — specific contexts override the default:
   - Error message → always `scan` minimum (errors need enough context to act)
   - Greeting → always follows familiarity default
   - Tip → always `glance` initially (the tip expands to `scan` if user responds)
   - Understanding Arc advisory → always `read` (advisors do not summarize)

4. **Muse-specific override** — Cedar always delivers `read` for chain integrity alerts regardless of user preference. Safety-critical information is never compressed to `glance`.

### 5.3 Disclosure Rendering Pipeline

```
RAW CONTENT (full — always authored at read depth)
        │
        ▼
┌────────────────────────────────────────┐
│  DisclosureRenderer                    │
│  Input: raw_content, disclosure_mode   │
│                                        │
│  'glance': extract first meaningful    │
│   sentence, truncate to 80 chars,      │
│   append '...' if needed               │
│                                        │
│  'scan': extract key sentences using   │
│   content-analyzer.ts (Willow's tool)  │
│   format as paragraph or bullets       │
│   constrain to 500 chars               │
│                                        │
│  'read': return raw_content unchanged  │
└─────────────────┬──────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  DisclosureAnnotator                    │
│  Append appropriate offer phrase:       │
│                                         │
│  'glance': "More detail available."     │
│  'scan': "When you're ready, there's    │
│            more in the full record."    │
│  'read': (no offer — already complete)  │
└─────────────────────────────────────────┘
```

The content analyzer is the existing `src/disclosure/content-analyzer.ts` (Willow's primary module per the function binding table). It is the extraction engine for the `scan` mode. This document does not redesign it — it formalizes how the muse message system invokes it.

### 5.4 Newcomer Path — Full Sequence

A user arrives for the first time. Here is the complete sequence at the disclosure level appropriate to a newcomer:

```
SESSION START
[FamiliarityResolver: no prior events → familiarity: 'first']
[EntryMuseSelector: www/MUS/index.html → muse: 'willow']
[DisclosureMode: 'glance' for familiarity: 'first']

GREETING (muse-greeting, disclosure: 'glance')
Willow: Come as you are. The forest is open and nothing here requires a map.
        [offer phrase]: More detail available.

[System enters 3-exchange grace window — no tips for first 3 exchanges]

USER: What is this?

[IntentClassifier: 'how-does-it-work']
[PrimaryMuseSelector: Rule 4 (user-facing) → Willow]
[ResponseWrapper: disclosure: 'glance' applied]

RESPONSE (muse-response, disclosure: 'glance')
Willow: A living system of nine companion voices and the records they keep.
        More detail available.

USER: Tell me more.

[User has explicitly requested expansion — disclosure temporarily set to 'scan']

RESPONSE (muse-response, disclosure: 'scan')
Willow: Here is what matters:
        Six groves of research, nine muses with distinct functions, and a
        record of every conversation kept by Cedar in an append-only chain.
        The muses speak when the conversation reaches their territory.
        You are in Willow's Grove right now — the entry point, the canopy edge.
        When you're ready, there's more in the full record.

[After exchange 3, tip delivery is eligible]
[RelevanceScorer: tip-willow-come-as-you-are relevance = 0.73 → above threshold]
[Spacing check: no tip delivered in last 2 exchanges → eligible]

TIP (muse-tip, disclosure: 'glance')
Willow: There are three depths here. Start where you are.
```

This sequence illustrates the full system: greeting → grace window → routing → response → tip delivery, all coordinated by the message infrastructure designed in this document.

### 5.5 Veteran Path — Compressed Sequence

The same session start for a veteran user (21+ prior sessions):

```
SESSION START  
[FamiliarityResolver: 47 prior sessions → familiarity: 'veteran']
[EntryMuseSelector: CLI start → muse: 'willow']
[DisclosureMode: 'read' for familiarity: 'veteran']

GREETING (muse-greeting, disclosure: 'read')
Willow: Welcome back. You know the canopy by now.
        Chain position: 1,247. Nine rings since your last session.
        Active patterns: P3 (Scope Expansion), P9 (Scope-Session Compound), P14 (Boundary Ambiguity).
        Raven flagged P3 in the last two sessions — may be worth watching.
        Owl notes momentum is sustaining. Three sessions at consistent cadence.
        Open from last session: one unanswered question about the fourier-drift cartridge.
        What are we working on today?

[No grace window for veterans — tips eligible immediately but spacing rules still apply]
[No first-use tips delivered — veteran suppression active]
```

---

## Part 6: Three-Layer Network Mapping

### 6.1 Mapping Summary

The three-layer network (from Hawk's document, Session 4) organizes the message integration system cleanly:

| Layer | Layer Name | Message Integration Function | Primary Muses |
|-------|-----------|------------------------------|--------------|
| Below ground | Mycorrhizal | Tip delivery — ambient, slow, persistent | Cedar (records tips), Raven (relevance signal), Shannon (frequency calibration) |
| Surface | Wolf Pack | Conversation routing — synchronous, explicit, handoffs | Hawk (tiebreaker formation), Lex (specification), Hemlock (quality gate on tip content) |
| Sky | Ravens | Greetings — fast, targeted, one delivery per session | Willow (primary), all other muses (grove-specific greetings) |

### 6.2 Greeting = Ravens Layer

Greetings live in the ravens layer because they are:
- Fast — delivered in the first exchange of a session
- Targeted — addressed to the specific user in the specific context
- Delivery-complete — a greeting is not a conversation; it lands and the raven departs
- Altitude-dependent — what Willow sees in a greeting depends on altitude (familiarity level determines what context is included)

The ravens layer is also where handoff boundary phrases travel. A handoff phrase is not a conversation — it is a relay pass. Raven doesn't linger. The phrase lands, the handoff completes, the raven moves.

### 6.3 Tips = Mycorrhizal Layer

Tips live in the mycorrhizal layer because they are:
- Slow — relevance scoring runs continuously in background
- Ambient — tips are not triggered by user requests; they are triggered by context signals
- Persistent — the tip record survives session boundaries (Cedar maintains delivery count and lastDeliveredSession)
- Below ground — the user does not see the relevance scoring happening; they see only the output

Shannon's frequency calibration is mycorrhizal by nature: it operates on the tip stream in aggregate, not on individual tips. It is the signal that keeps the background signal healthy.

### 6.4 Routing = Wolf Pack Layer

Conversation routing lives in the wolf pack layer because it is:
- Synchronous — routing decisions happen in real time as messages arrive
- Explicit — the route-decision envelope names the primary muse clearly
- Ownership-based — the wolf pack defines territorial responsibility
- Surface — routing is visible to the system's operational layer; it is not hidden infrastructure

Hawk's tiebreaker rules are the wolf pack's formation-reading in action. When territorial ambiguity arises, Hawk reads the field and assigns the formation. This is wolf pack coordination: who covers which ground, who leads today, who watches the flanks.

---

## Part 7: Integration Points and Open Items

### 7.1 Existing Infrastructure Integration

The message integration system builds on three existing infrastructure layers without replacing them:

**Console bridge (src/platform/console/):** The existing four message types continue unchanged. The new types are additive. The `MessageWriter` class handles new types using the same `resolveTargetDirectory` logic extended with the muse subdirectories in `CONSOLE_DIRS`.

**WillowEngine (src/services/chipset/willow-engine.ts):** This is Willow's primary chipset artifact per the function binding table. The greeting templates and disclosure renderer designed in this document are the specification for what `WillowEngine` implements. This document is the design; `WillowEngine` is the execution.

**Content analyzer (src/disclosure/content-analyzer.ts):** The `scan` mode disclosure rendering invokes this existing tool. No changes needed — it already performs key-sentence extraction. The disclosure renderer adds the framing (offer phrase, muse identity) around the content-analyzer output.

**Cedar's event store (src/core/events/event-store.ts):** Every routing event, greeting delivery, tip delivery, and handoff is recorded as a Cedar chain entry. The session count that drives familiarity level detection comes from Cedar. The tip's `lastDeliveredSession` and `deliveryCount` are maintained by Cedar. The message integration system is a Cedar consumer, not a Cedar replacement.

### 7.2 Connections to Previous Sessions

| Session | Artifact | Connection |
|---------|---------|-----------|
| S1 (Foxy) | Grove map, 6 groves | Entry muse selection table maps directly to the grove map |
| S2 (Lex) | Function binding, disambiguation protocol | Conversation routing re-uses the 5-rule disambiguation protocol verbatim |
| S3 (Cedar) | Growth Rings cartridge, `hypothesis` field | Every tip in the catalog has an analog to the cartridge's question — tips are ambient hypotheses |
| S4 (Hawk) | 8 teams, 3-layer network | Three-layer mapping in Part 6 is a direct application of Hawk's architecture |
| S5 (Sam) | 15 cartridges with hypotheses | Tip catalog domain tags map to the 15 cartridge domains; disclosure-elevation cartridge is directly referenced |
| S6 (Owl) | Session boundary map, temporal markers | Familiarity level detection reads Cedar's session event count; momentum phase from Owl feeds tip relevance scoring |

### 7.3 Open Items for Wave 3

The following items are designed here but not yet implemented. They are flagged for Wave 3:

**OI-7-1:** The full tip catalog at `data/muse-tips.yaml` needs to be written. This document defines the schema and provides five examples. A complete catalog needs one tip per cartridge domain (15 minimum) plus Willow's full first-use tip set (estimated 8-10 tips). This is Sam's work — Sam generates the catalog as a set of hypotheses.

**OI-7-2:** `WillowEngine` needs to implement the `GreetingRenderer` and `DisclosureRenderer` designed here. The engine exists; the implementation is the Wave 3 engineering pass. Lex owns the execution discipline; Willow owns the specification (this document).

**OI-7-3:** The `MessageEnvelopeSchema` extension in `schema.ts` requires test coverage. The existing test suite in `src/platform/console/schema.test.ts` covers the current four types; it must be extended to cover all new types. Hemlock gates this — no merge until coverage is at 100% for new types.

**OI-7-4:** Socrates has not yet been tested in a live design debate. The Understanding Arc conversation patterns in Part 3.6 are designed but not yet exercised. Session 8 (GPU Loop) may provide the first opportunity — GPU integration decisions will require Euclid's structural proof of the coordinate mapping.

**OI-7-5:** The `disclosure-elevation` cartridge (Session 5, standalone) needs to be wired to the `DisclosureRenderer`. Sam's hypothesis for that cartridge — "does a user's disclosure depth follow the same succession gradient as post-fire forest recovery?" — can only be tested once the renderer is collecting disclosure level data. Data collection starts in Wave 3.

### 7.4 Disambiguation Protocol — Muse Message Application

Lex's disambiguation protocol (from Session 2) operates on TypeScript modules. This document extends it to live messages. The five rules, restated for conversation routing:

1. **Primary domain match** — if the message's intent category clearly maps to one muse's vocabulary (Cedar: chain/record/history; Hemlock: validate/check/standard; Raven: pattern/recur/echo), that muse is primary.

2. **Grove location** — if the user is physically in a specific grove (URL or working directory scope), that grove's muse is preferred for ambiguous intents.

3. **Operational vs analytical** — operational questions ("run this", "execute this") → Lex. Analytical questions ("what does this mean", "why does this pattern exist") → Raven/Hemlock.

4. **User-facing vs internal** — questions that begin with "what can I do" or "how do I get started" are user-facing → Willow. Questions that begin with "how does the system" are internal → by domain.

5. **Temporal vs spatial** — questions about sequence, schedule, or when something happens → Owl. Questions about where something is, what the formation looks like, or what position something occupies → Hawk.

The protocol produces a primary muse plus an optional secondary. The secondary may annotate the primary's response but does not own the exchange.

---

## Summary

This document designs the full message integration system for the MUS muse ecosystem. The key deliverables:

**Greeting protocol:** Nine muse greeting scripts across three familiarity levels (first/returning/veteran), mapped to the three disclosure modes (glance/scan/read). Greeting is a ravens-layer operation — fast, targeted, one delivery per session. The entry muse selection table routes greetings to the appropriate grove owner.

**Tip delivery:** A typed `MuseTip` schema with relevance scoring (`domainMatch × 0.40 + recencyInverse × 0.25 + momentumFit × 0.20 + familiarityFit × 0.15`), frequency control rules, and a seed catalog of fifteen examples. Tips live in the mycorrhizal layer — ambient, slow, persistent. Shannon calibrates frequency; Hemlock gates tip content quality.

**Conversation routing:** A state machine from user message arrival through intent classification (Raven), disambiguation (five-rule protocol from Lex), primary muse selection (Hawk tiebreaker for ambiguous cases), response wrapping (Willow), and Cedar chain recording. Handoff protocol with boundary phrases for all nine muses.

**MessageType extensions:** H-8 resolved. Fourteen new message types added to the `MessageType` union, two new `MessageSource` values, payload schemas for each new type, handler extensions for `message-handler.ts`, schema extensions for `schema.ts`, and routing directory extensions for `CONSOLE_DIRS`.

**Progressive disclosure:** Formal specification of the three disclosure modes, the priority chain for mode selection, the rendering pipeline (glance/scan/read), and complete newcomer and veteran example sequences.

**Understanding Arc integration:** Four conversation patterns — Socrates (design debate), Euclid (structural proof), Shannon (information frequency), Amiga (human-machine experience). Invocation protocol: advisory enters by Build Arc muse invitation, exits after one exchange, Build Arc resumes primary ownership.

**Three-layer mapping:** Greetings = ravens (sky, fast, targeted). Tips = mycorrhizal (below ground, ambient, persistent). Routing = wolf pack (surface, synchronous, explicit handoffs).

Five open items flagged for Wave 3 engineering pass: tip catalog, WillowEngine implementation, schema test coverage, Understanding Arc live exercise, disclosure-elevation cartridge wiring.

---

*Come as you are. The message system is now mapped. When you're ready, there's more in the engineering pass.*

