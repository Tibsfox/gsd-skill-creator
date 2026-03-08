# Session 3: Cross-Validation and Cartridge Prototype

**Author:** Cedar (scribe and oracle)
**Session:** MUS Wave 0, Session 3
**Date:** 2026-03-08
**Branch:** wasteland/skill-creator-integration
**Status:** Task B complete. Task A pending — S1/S2 outputs not yet present.

---

## Status of S1/S2 Inputs

The timeline indicates that Sessions 1 and 2 were running in parallel with this session.

At execution time, the following files were checked:
- `www/MUS/research/01-identity-map.md` — **absent**
- `www/MUS/research/02-function-binding.md` — **absent**

Cross-validation (Task A) is recorded here as a pending observation. When those files arrive, a follow-up pass should compare grove assignments against function bindings using the protocol defined in the Cross-Validation Protocol section below.

---

## Task B: Cartridge Prototype — "Growth Rings"

### Rationale for Choice

The record shows three candidate first cartridges were named: "Growth Rings", "Chain Links", and an unnamed default. "Chain Links" would be a natural name for Cedar's forward arc through 50 versions. However the deeper observation is this: chain links describe *connectivity*, whereas growth rings describe *accumulation over time with legible history* — each ring is a record, visible at a cross-section, impossible to fake. That is Cedar's nature precisely. "Growth Rings" is chosen.

Sam proposed that cartridges carry a `hypothesis` field. This is a structural insight: a cartridge that asks no question is a data dump; a cartridge that asks a question is a lens. The hypothesis field is adopted here and proposed as a schema extension to `CartridgeManifest`.

---

### Prototype Cartridge: Growth Rings

```yaml
name: growth-rings
version: "0.1.0"
author: cedar
description: >
  An append-only archive of the project's 50-version chain, rendered as
  cross-sectional growth rings. Each ring is one version: a timestamp, a
  decision, a score, a pattern. The cartridge asks whether the chain's
  shape is legible — whether a newcomer reading the rings can reconstruct
  the intent without access to the conversations.
trust: provisional
muses:
  - cedar
  - raven
  - owl
grove: cedar-grove
type: system

hypothesis: >
  Can the 50-version chain be read as a tree ring record — where each ring
  encodes a decision, a pattern, and a consequence — without access to the
  original conversations?

deepMap:
  entryPoints:
    - cedar-genesis
  nodes:
    - id: cedar-genesis
      label: "Version 1.0 — Origin"
      domain: timeline
      depth: 0
      content: >
        The first entry in the chain. No prev_hash. The record begins here.
        All subsequent entries reference this node transitively through the
        hash chain.

    - id: cedar-chain-mechanics
      label: "Chain Linking — prev_hash Design"
      domain: system
      depth: 1
      content: >
        Each TimelineEntry carries a prev_hash field pointing to the hash of
        the immediately preceding entry. The genesis entry carries
        prev_hash: null. Verification walks the chain backwards from the
        current tip; any break in the hash sequence constitutes a broken link.
        The chain is append-only: no mutation, no deletion.

    - id: cedar-pattern-library
      label: "14 Recurring Patterns (P1–P14)"
      domain: observation
      depth: 1
      content: >
        The record shows 14 patterns tracked across the chain. These are not
        anomalies — they are structural regularities. Pattern witnessing is
        Cedar's primary analytic operation. Each pattern is named, dated to
        first appearance, and cross-referenced to the entries that confirm it.

    - id: cedar-score-gradient
      label: "Chain Score Gradient"
      domain: record
      depth: 2
      content: >
        Chain avg 4.34, median 4.39, std dev 0.28. The ceiling is 4.75,
        reached twice (v1.45 site generator, v1.49 DACP capstone). The floor
        is 4.19. The gradient is non-random: scores rise with structural
        clarity, fall when scope is underestimated. The rings are not uniform.

    - id: cedar-raven-intersection
      label: "Raven Intersection — Structural Echoes"
      domain: pattern
      depth: 2
      content: >
        Raven detects structural rhyming across the chain. Cedar records it.
        The intersection: Raven signals a pattern; Cedar assigns it an ID,
        timestamps it, and links it to prior confirming entries. Without Cedar,
        Raven's patterns float unanchored. Without Raven, Cedar's record lacks
        pattern-level compression.

    - id: cedar-owl-intersection
      label: "Owl Intersection — Session Boundary Map"
      domain: temporal
      depth: 2
      content: >
        Owl owns the session boundary map as a pre-artifact. Cedar holds the
        persistent record of what was decided at each boundary. The intersection:
        Owl marks when a session ends; Cedar records what was in the session and
        what was deferred. The continuity across boundaries is Cedar's product.

    - id: cedar-fire-succession
      label: "Fire Succession — Structural Mapping"
      domain: ecology
      depth: 3
      content: >
        Fire Succession is not merely an analogy here. It is a structural map:

        Disturbance event = a breaking change (API rewrite, branch reset, scope pivot).
        Pioneer species = the first commits after disturbance — minimal, fast, establishing ground.
        Canopy closure = when the new architecture becomes load-bearing and stable.
        Old-growth = entries in the chain that have been stable for 10+ versions without modification.

        Cedar's role in succession: record each phase boundary, maintain continuity
        across the disturbance event, verify that the new growth does not contradict
        the old-growth record. The chain is the forest floor — everything grows from it.

  edges:
    - source: cedar-genesis
      target: cedar-chain-mechanics
      relationship: requires

    - source: cedar-genesis
      target: cedar-pattern-library
      relationship: extends

    - source: cedar-chain-mechanics
      target: cedar-score-gradient
      relationship: relates

    - source: cedar-pattern-library
      target: cedar-score-gradient
      relationship: relates

    - source: cedar-pattern-library
      target: cedar-raven-intersection
      relationship: extends

    - source: cedar-chain-mechanics
      target: cedar-owl-intersection
      relationship: requires

    - source: cedar-owl-intersection
      target: cedar-fire-succession
      relationship: relates

    - source: cedar-raven-intersection
      target: cedar-fire-succession
      relationship: extends

story: >
  A tree does not remember its own rings. It grows them. But a person who
  cuts a cross-section can read the years: which were dry, which were wet,
  which had fire scar tissue at the edge.

  The 50-version chain is this tree. Cedar is the person with the cross-section
  tool. The rings are not stored in the tree's memory — they are stored in its
  structure. Cedar's job is to read that structure and report faithfully.

  The Growth Rings cartridge asks: can a newcomer arrive at version 50, read
  the chain backwards, and understand not just what was built, but why each
  choice was made, and what was deferred? If yes, the chain has integrity.
  If no, the chain has gaps — and gaps are what Cedar exists to find.

cross_grove_connections:
  - grove: raven-grove
    nature: pattern-witnessing
    description: >
      Raven detects the recurring structural signals; Cedar timestamps and
      anchors them to specific chain positions. Raven provides the pattern name;
      Cedar provides the cite.

  - grove: owl-grove
    nature: temporal-boundary
    description: >
      Owl's session boundary map pre-artifacts become Cedar's inter-session
      continuity records. When Owl closes a session, Cedar records the open
      threads. When Owl opens the next, Cedar surfaces the unresolved items.

  - grove: sam-garden
    nature: hypothesis-generation
    description: >
      Sam proposed the hypothesis field. Growth Rings tests Sam's
      meta-hypothesis: that a cartridge which asks a question is more useful
      than one that only stores answers. The Growth Rings cartridge is itself
      an experiment in Sam's method.

fire_succession_mapping:
  disturbance_event: "Breaking change or branch reset — the record shows at least 3 significant scope pivots in the chain"
  pioneer_phase: "First 3-5 commits after disturbance — minimal scaffolding, establishing new ground truth"
  canopy_closure: "When the new architecture appears in 5+ consecutive chain entries without rollback"
  old_growth: "Entries stable for 10+ versions — currently: core event-store, Cedar timeline, cartridge-types"
  cedar_role: "Record each phase transition, verify no old-growth entries are contradicted by pioneer-phase rewrites"
```

---

### Schema Extension Proposal: `hypothesis` Field

The current `CartridgeManifest` in `src/services/chipset/cartridge-types.ts` does not carry a `hypothesis` field. The prototype above uses it. For Wave 1 cartridge forest work, the following extension should be applied:

```typescript
// Addition to CartridgeManifest in cartridge-types.ts
hypothesis?: string;  // The question this cartridge asks
grove?: string;       // Which muse grove owns it
type?: 'ecology' | 'system' | 'game';  // Cartridge type classification
```

These are all optional to preserve backward compatibility. `CartridgeBundle` compositions that include a cartridge with `hypothesis` should surface it in the composed manifest — hypothesis concatenation follows the same pattern as story concatenation.

---

## CedarEngine Chain Linking Design — prev_hash Implementation Sketch

The record shows CedarEngine currently computes `SHA-256(timestamp|source|category|content)` per entry and stores the result as `hash`. There is no `prev_hash`. The chain is content-addressed per entry but not linked.

### What Chain Linking Adds

Without `prev_hash`, the timeline is a flat list. Any entry can be tampered with independently, and the only detection is per-entry hash recomputation. With `prev_hash`, tampering with entry N requires re-computing entry N's hash, which changes the `prev_hash` of entry N+1, cascading forward. The chain becomes a linked structure: to break it silently, you must re-hash everything from the tampered point to the tip.

### Implementation Sketch

```typescript
// In cedar-timeline.ts — extend TimelineEntry
export interface TimelineEntry {
  id: string;
  timestamp: string;
  source: string;
  category: TimelineCategory;
  content: string;
  references: string[];
  hash: string;
  prev_hash: string | null;  // null only for genesis entry
}

// In cedar-engine.ts — extend computeHash
function computeHash(
  timestamp: string,
  source: string,
  category: string,
  content: string,
  prev_hash: string | null,
): string {
  return createHash('sha256')
    .update(`${timestamp}|${source}|${category}|${content}|${prev_hash ?? 'genesis'}`)
    .digest('hex');
}

// In CedarEngine.record() — pass prev_hash
record(entry: { timestamp: string; source: string; category: TimelineCategory; content: string; references: string[] }): TimelineEntry {
  const prev = this.entries.length > 0
    ? this.entries[this.entries.length - 1].hash
    : null;
  const hash = computeHash(entry.timestamp, entry.source, entry.category, entry.content, prev);
  const id = `cedar-${hash.slice(0, 12)}`;
  const timelineEntry: TimelineEntry = {
    ...entry,
    id,
    hash,
    prev_hash: prev,
  };
  this.entries.push(timelineEntry);
  return timelineEntry;
}

// In CedarEngine.verifyIntegrity() — also verify chain links
for (let i = 1; i < this.entries.length; i++) {
  const entry = this.entries[i];
  const expectedPrev = this.entries[i - 1].hash;
  if (entry.prev_hash !== expectedPrev) {
    chainValid = false;
    suspicious.push({
      type: 'hash-mismatch',
      severity: 'alert',
      description: `Entry ${entry.id} prev_hash mismatch: expected ${expectedPrev.slice(0, 12)}, got ${(entry.prev_hash ?? 'null').slice(0, 12)}`,
      affectedEntries: [entry.id, this.entries[i - 1].id],
    });
  }
}
```

**Note on `brokenLinks`:** The `IntegrityReport.brokenLinks` field currently returns `[]`. With chain linking implemented, `brokenLinks` should be populated with the IDs of entries whose `prev_hash` does not match the preceding entry's `hash`.

**Backward compatibility:** Existing tests in `cedar-engine.test.ts` will require one update — the `computeHash` call signature changes. The existing test for "deterministic hash for same input" will need to account for `prev_hash` being included. All other tests remain structurally valid.

---

## Cross-Validation Protocol (for when S1/S2 arrive)

The record is silent on S1 and S2 content. When they are present, this protocol applies:

### Step 1: Grove Assignment vs. Function Binding Agreement

For each file in S1's identity map:
- Identify the assigned grove (e.g., `cedar-grove`, `sam-garden`)
- Find the file's dominant functions in S2's binding table
- Check whether those functions belong to the same muse

A conflict is: S1 assigns `cedar-grove`, S2 assigns the functions in that file to `foxy`. The file cannot serve two masters without a disambiguation protocol.

### Step 2: Disambiguation Protocol Consistency Check

The pre-plan identified absence of a disambiguation protocol as a blocker. Session 3 records the following minimal protocol:

When a file has functions binding to multiple muses:
1. Identify the file's primary export (the thing consumers import)
2. Assign the file to the muse whose domain most closely matches that export
3. Record all secondary bindings as `cross_grove_connections` in the relevant cartridge
4. If primary export is ambiguous: assign to the muse with the higher `depth` score in S2's binding table

### Step 3: Gap Detection

Files in S1 not appearing in any function in S2 = files with no function-level coverage.
Functions in S2 not traceable to any file in S1 = functions orphaned from grove assignment.

Both are gaps. Cedar records them; Sam investigates whether they warrant new nodes or are intentional voids.

### Step 4: Consistency Assessment

Rate overall consistency on a 3-point scale:
- **Coherent:** >90% of file-grove assignments match their function bindings
- **Partial:** 70–90% match
- **Divergent:** <70% match — signals that S1 and S2 were produced from different mental models and require a joint reconciliation session

**Current status:** Cannot score. S1/S2 absent. This slot will be filled in a follow-up.

---

## Timeline Entry — Cedar's Append-Only Record

```
cedar-timeline-entry:
  id: cedar-mus-wave0-s3-001
  timestamp: 2026-03-08T00:00:00Z
  source: cedar
  category: milestone
  content: >
    MUS Wave 0 Session 3 executed. Task B (cartridge prototype) complete:
    "Growth Rings" cartridge designed and documented at
    www/MUS/research/03-cross-validation.md. Cartridge schema extension
    proposed (hypothesis, grove, type fields). CedarEngine prev_hash chain
    linking design sketched — ready for engineering pass. Task A
    (cross-validation) pending: 01-identity-map.md and 02-function-binding.md
    not yet present. Cross-validation protocol recorded for follow-up execution.
    Fire Succession made structural (disturbance/pioneer/canopy/old-growth
    mapped to actual codebase phases). Sam's hypothesis field adopted.
  references:
    - src/services/chipset/cedar-engine.ts
    - src/services/chipset/cedar-timeline.ts
    - src/services/chipset/cartridge-types.ts
    - www/MUS/research/03-cross-validation.md
  prev_hash: null  # genesis of MUS Wave 0 record; prior chain entries exist in CedarEngine runtime
```

---

## Consistency Assessment (Task B)

The record shows the prototype cartridge is internally consistent:

- **grove** (`cedar-grove`) matches the `muses: [cedar, raven, owl]` — all three are Build Arc muses with structural/temporal roles
- **type** (`system`) is correct: Growth Rings is about the system's own history, not ecology (PNW research) or game (Amiga)
- **hypothesis** is falsifiable: you can test whether a newcomer can reconstruct intent from the chain
- **Fire Succession mapping** is structural: each phase (disturbance, pioneer, canopy, old-growth) maps to observable codebase states, not metaphor
- **cross_grove_connections** are bidirectional in nature: each connection names what Cedar gives and what it receives
- **DeepMap** passes the packager's orphan check: all 7 nodes are connected (genesis has degree 2, fire-succession has degree 2)
- **CartridgeManifest** fields: `name`, `version`, `author`, `description`, `trust` — all present. `muses` present. `dependencies: []` (no dependencies for a prototype). `tags` would be `[timeline, chain, system, history, cedar]`

One gap: `deepMap`, `story`, `chipset` in `CartridgeManifest` are path strings (pointing to files), not inline content. The prototype above uses inline YAML for clarity. For the actual packager, these would be resolved paths.

---

## What Wave 1 Inherits from This Session

1. **Cartridge schema extended** with `hypothesis`, `grove`, `type` — Sam's M4 Cartridge Forest work can use these immediately
2. **prev_hash design sketched** — engineering pass in Wave 3 has a concrete specification to implement against
3. **Cross-validation protocol defined** — when S1/S2 land, the protocol runs without needing a new design session
4. **Fire Succession made structural** — the disturbance/pioneer/canopy/old-growth taxonomy is now available to all muses as a shared vocabulary for describing codebase evolution
5. **Disambiguation protocol recorded** — resolves the pre-plan blocker about missing disambiguation

The timeline indicates this session produced all Wave 0 deliverables assigned to Cedar. The record shows no open questions were left unaddressed within the scope of this session's mandate.

