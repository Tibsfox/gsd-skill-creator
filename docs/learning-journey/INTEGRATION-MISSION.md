# Mission: Wasteland-to-Skill-Creator Integration

## Vision

Wire the wasteland federation into the skill-creator's existing machinery — observation, services, core infrastructure, educational packs — so the integration speaks to the core and the core can observe the integration.

The wasteland is the most fully-realized domain in this codebase. It has types, client, trust engine, stamp pipeline, clustering, routing, and policy generation — all functional. But it lives in isolation. The core event bus can't see it. The observation layer can't measure it. The services layer can't orchestrate it. The educational layer has a pack ready but no runtime to drive it.

**The work is adapter work, not architecture work.** The shapes are right. What's missing is the seam layer.

---

## What Four Muses Found

### Hawk — Services Layer
Five natural connection points:
1. **Autonomy engine** (`services/autonomy/engine.ts`) — maps directly to federation mission orchestration via `SubversionCallbacks` adapter
2. **Gate evaluator** (`services/orchestrator/gates/gate-evaluator.ts`) — primitive for trust-level operation gates, needs trust-level adapter shell
3. **Team lifecycle** (`services/teams/team-lifecycle.ts`) — `createTeam/dissolveTeam` maps to rig spawn/retire
4. **Stack bridge** (`services/chipset/integration/stack-bridge.ts`) — architectural model for Dolt event ingestion
5. **Blitter signals** (`services/chipset/blitter/signals.ts`) — `CompletionSignal` needs converter to `StampRecommendation`

Three irrelevant services: detection, brainstorm, most of orchestrator/state. Discovery is a stretch for capability inference.

### Raven — Observation Layer
Seven structural isomorphisms (agent learning arcs = rig trust arcs):
1. **PromotionEvaluator** → trust scoring (6 weighted factors, transparent reasons)
2. **PromotionGatekeeper** → stamp validation (6 gates, exhaustive evaluation, audit trail)
3. **LineageTracker** → validation chain provenance (bidirectional)
4. **DriftMonitor** → trust revocation on behavioral drift
5. **PatternAnalyzer** → rig behavior clusters and learning arcs
6. **Dashboard infrastructure** → federation health visualization
7. **Staging state machine** → trust lifecycle (`submitted → validating → disputed → granted → suspended`)

Build new: DoltHub persistence adapter for PatternStore, federation capability vector dimensions.

### Hemlock — Core Infrastructure
One critical, five important, two nice-to-have:

| Finding | Severity | Fix |
|---------|----------|-----|
| `localDir` not path-validated before `execFile` CWD | **Critical** | Wire `assertSafePath()` from `core/validation/path-safety.ts` |
| Zero core type reuse — parallel type dialect | Important | Import shared types from `core/types/` |
| Zero event bus integration — rig activity invisible | Important | Emit `wasteland:*` events via `core/events/` |
| No JSONL storage — feedback/checkpoint data ephemeral | Important | Use `PatternStore` for derived/analytical data |
| No prompt injection screening on evidence text | Important | Apply `sanitizeMessageText()` from `core/validation/message-safety.ts` |
| CLI flag helpers duplicated in every wl-* command | Important | Extract shared CLI utilities module |
| No cooldown on scan cycle | Nice-to-have | Wire `OperationCooldown` from `core/safety/` |
| No error boundary on dolt operations | Nice-to-have | Wire `withErrorBoundary()` from `core/hooks/` |

### Willow — Educational Layer
The newcomer pack already exists (`src/packs/pack-wasteland-newcomer/PACK.json`):
- 6 phases, schema-conformant, auto-discoverable by pack loader
- Missing: `RESOURCES/mvr-protocol.md` and `RESOURCES/passbook-guide.md`
- Missing: runtime session driver (no phase-walker yet)
- `WantedRegistry` could mirror `PackRegistry` interface for task discovery
- College `federation-onboarding` track could formalize the 42-department mapping
- Circular path: pack → newcomer → stamp → college → next pack

---

## Requirements

### R1: Security (Critical — before anything else)
- **R1.1** Path-validate `localDir` in `bootstrap.ts` and `dolthub-client.ts` using `assertSafePath()`
- **R1.2** Apply `sanitizeMessageText()` to evidence text in `wl-done.ts` before SQL generation

### R2: Core Integration (Foundation — enables everything else)
- **R2.1** Wire wasteland events onto the core event bus (`wasteland:scan-complete`, `wasteland:trust-escalation`, `wasteland:stamp-issued`, `wasteland:gate-triggered`)
- **R2.2** Adopt core types where overlap exists (align `ObservationEvent`, `AgentProfile`, `FailureClass` with core vocabulary)
- **R2.3** Use `PatternStore` for local persistence of feedback records, checkpoint state, confidence scores
- **R2.4** Extract shared CLI flag utilities from duplicated wl-* helpers

### R3: Observation Bridge (The measurement layer)
- **R3.1** Create DoltHub persistence adapter implementing PatternStore interface
- **R3.2** Wire PromotionEvaluator as trust scoring engine (re-weight factors for wasteland signals)
- **R3.3** Wire PromotionGatekeeper as stamp validation pipeline
- **R3.4** Wire LineageTracker for validation chain provenance
- **R3.5** Wire DriftMonitor for trust revocation on behavioral drift

### R4: Services Bridge (The orchestration layer)
- **R4.1** Create SubversionCallbacks adapter connecting autonomy engine to wasteland Dolt operations
- **R4.2** Create trust-level gate adapter wrapping gate-evaluator with rig trust level
- **R4.3** Wire CompletionSignal → StampRecommendation converter
- **R4.4** Add scan scheduling via autonomy engine's scheduler + watchdog

### R5: Educational Layer (The newcomer path)
- **R5.1** Create missing pack resources (`RESOURCES/mvr-protocol.md`, `RESOURCES/passbook-guide.md`)
- **R5.2** Create WantedRegistry bridging Dolt wanted items to PackRegistry-style search
- **R5.3** Add `federation-onboarding` track to college `tracks.json`
- **R5.4** Wire pack session driver connecting learn pipeline to PackDocument phases

### R6: Dashboard (The visibility layer)
- **R6.1** Adapt `buildTopologyData()` for federation health graph (rigs as agents, trust levels as domains)
- **R6.2** Adapt heartbeat/timeline/emergent-ratio metrics for rig activity visualization

---

## Mission Breakdown

### Phase 1: Security + Core Wiring
**Goal:** Close the critical security gap and establish the core integration surface.
**Scope:** R1 (all), R2.1, R2.4
**Why first:** R1.1 is critical. R2.1 (event bus) is the foundation everything else observes through.

Expected work:
- `assertSafePath()` on localDir in bootstrap + dolthub-client (R1.1)
- `sanitizeMessageText()` on evidence in wl-done (R1.2)
- Define and emit 4 wasteland event types on core bus (R2.1)
- Extract shared CLI flag utilities module (R2.4)

### Phase 2: Storage + Type Alignment
**Goal:** Unify the wasteland's data patterns with core infrastructure.
**Scope:** R2.2, R2.3
**Why second:** Type alignment and storage patterns are consumed by every subsequent phase.

Expected work:
- Audit wasteland types against core types, adopt shared vocabulary where shapes match (R2.2)
- Wire PatternStore for feedback records, checkpoint state, confidence scores (R2.3)

### Phase 3: Observation Bridge
**Goal:** Connect the observation layer's measurement machinery to wasteland federation tracking.
**Scope:** R3 (all)
**Why third:** Depends on storage alignment (Phase 2) and events (Phase 1).

Expected work:
- DoltHub PatternStore adapter (R3.1)
- PromotionEvaluator → trust scoring with wasteland-weighted factors (R3.2)
- PromotionGatekeeper → stamp validation with 6 gates (R3.3)
- LineageTracker → validation chain provenance (R3.4)
- DriftMonitor → trust revocation (R3.5)

### Phase 4: Services Bridge
**Goal:** Wire the autonomy engine and gate system to wasteland orchestration.
**Scope:** R4 (all)
**Why fourth:** Depends on observation bridge (Phase 3) for the signals these services consume.

Expected work:
- SubversionCallbacks adapter for autonomy engine → Dolt operations (R4.1)
- Trust-level gate adapter wrapping gate-evaluator (R4.2)
- CompletionSignal → StampRecommendation converter (R4.3)
- Scan scheduling with watchdog (R4.4)

### Phase 5: Educational Layer
**Goal:** Complete the newcomer onboarding path from pack to college.
**Scope:** R5 (all)
**Why fifth:** The pack resources reference tools and concepts built in Phases 1-4.

Expected work:
- Pack RESOURCES content (R5.1)
- WantedRegistry with tag search (R5.2)
- College federation-onboarding track (R5.3)
- Pack session driver (R5.4)

### Phase 6: Dashboard + Visibility
**Goal:** Federation health visible at a glance.
**Scope:** R6 (all)
**Why last:** Depends on events (Phase 1), observation (Phase 3), and services (Phase 4) for the data it visualizes.

Expected work:
- Federation topology graph (R6.1)
- Rig activity metrics (heartbeat, timeline, emergent ratio) (R6.2)

---

## Dependency Chain

```
Phase 1 (Security + Core Wiring)
  └─→ Phase 2 (Storage + Types)
       └─→ Phase 3 (Observation Bridge)
            └─→ Phase 4 (Services Bridge)
                 └─→ Phase 5 (Educational Layer)
                      └─→ Phase 6 (Dashboard)
```

Linear chain. Each phase builds the surface the next phase needs. No parallelism between phases — but plans within each phase can parallelize.

---

## What This Mission Is Not

- Not a rewrite. The wasteland integration stays where it is. We're wiring it in, not rebuilding it.
- Not a migration. Types get aligned, not replaced. Where wasteland types are richer, they stay.
- Not comprehensive. The services layer has modules we intentionally skip (brainstorm, detection, most of orchestrator/state). We wire what fits.
- Not the end. This mission makes the wasteland observable, orchestrable, and teachable. What happens after — that's the next mission.

---

## Muse Attribution

| Muse | Domain Studied | Key Finding |
|------|---------------|-------------|
| **Hawk** | Services layer | "The work is adapter work, not architecture work. The shapes are right." |
| **Raven** | Observation layer | "The isomorphism is structural — both solve 'how do you measure earned trust over time.'" |
| **Hemlock** | Core infrastructure | "The integration does not speak to the core, and the core cannot observe the integration." |
| **Willow** | Educational layer | "The newcomer pack already exists. The circular path closes: pack → stamp → college → next pack." |
| **Cedar** | Contemplation | "The branch did not drift. It descended." |
| **Sam** | Forest walk | "Home is the fire at r=0.0 and everything orbiting it." |

---

*Mission document by the muses + Claude*
*Branch: wasteland/skill-creator-integration*
*Surveyed: 2026-03-07*
*Status: Vision complete. Ready for phase planning.*
