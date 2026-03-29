# Mission Catalog Index — Component Specification

**Milestone:** NASA Mission Series
**Wave:** 1 | **Track:** A
**Model Assignment:** Sonnet
**Estimated Tokens:** ~25K
**Dependencies:** Component #0 (Shared Types)
**Produces:** `docs/nasa/catalog/mission-index.json`, `docs/nasa/catalog/README.md`, `docs/nasa/catalog/epoch-summaries/`

---

## Objective

Create the complete, validated mission catalog index containing all ~73 NASA missions in chronological order, each with full metadata conforming to the NASAMission schema. This index is the master schedule for the entire series — every release references it. Done means: the JSON file validates, covers all six epochs, preserves chronological order, and includes safety flags for sensitive missions.

## Context

The research reference (02-research-reference.md) contains the full catalog table with 73 entries across 6 epochs. This component transforms that table into a machine-readable JSON index with complete metadata for each entry. The index serves as both the human-readable mission schedule and the machine-readable input for the pipeline executor.

Key design decisions:
- Missions within grouped entries (e.g., "Gemini 9A-12") get a single catalog entry but may be split by the retrospective system if later analysis warrants it
- Planned/future missions (Artemis III+, Dragonfly, Mars Sample Return) are included with `type: "planned"` and appropriate safety flags
- The catalog is a living document — it can grow but entries are never deleted

Schema reference (from Component #0):
```typescript
interface NASAMission {
  id: string;           // kebab-case, unique, immutable
  version: string;      // e.g., "1.5"
  name: string;
  epoch: 1 | 2 | 3 | 4 | 5 | 6;
  dateStart: string;    // ISO date
  dateEnd?: string;
  type: MissionType;
  crew?: CrewMember[];
  launchVehicle?: string;
  spacecraft?: string;
  objectives: string[];
  outcomes: string[];
  significance: string;
  predecessors: string[];
  successors: string[];
  safetyFlags: SafetyFlag[];
}
```

## Technical Specification

### Interfaces

**Input:** Research reference mission catalog table (02-research-reference.md)
**Output:** `mission-index.json` — array of NASAMission objects, chronologically ordered

### Behavioral Requirements

- Every mission from the research reference must appear in the index
- Chronological order by `dateStart` — strict ascending
- No duplicate `id` values
- No duplicate `version` values
- Safety flags must be set for: Apollo 1 (`disaster-narrative`), Challenger (`disaster-narrative`), Columbia (`disaster-narrative`), all Mars missions with science (`biosignature-boundary`), all planned missions (`ongoing-mission`)
- Predecessor/successor chains must be bidirectional (if A lists B as successor, B must list A as predecessor)
- Epoch boundaries must match research reference definitions

### Implementation Notes

- Use the 73-entry catalog from the research reference as the starting point
- For each entry, expand the table row into a full NASAMission object
- Crew data for crewed missions should include at minimum Commander and Pilot names
- Launch vehicles should use standard designations (Mercury-Redstone, Mercury-Atlas, Titan II GLV, Saturn IB, Saturn V, Space Shuttle [orbiter name], Falcon 9, SLS Block 1, etc.)
- The epoch-summaries/ subdirectory contains one markdown file per epoch with a narrative overview

## Implementation Steps

1. Create `docs/nasa/catalog/mission-index.json` with all entries
2. Validate against NASAMission JSON Schema
3. Verify chronological order (script)
4. Verify no duplicate IDs or versions (script)
5. Verify bidirectional predecessor/successor chains (script)
6. Create `docs/nasa/catalog/README.md` with human-readable catalog table
7. Create epoch summary files (one per epoch)
8. Run full schema validation: `scripts/validate-catalog.sh`

## Test Cases

| Test ID | Input | Expected Output | Pass Condition |
|---------|-------|-----------------|----------------|
| MC-01 | mission-index.json | JSON Schema validation | Zero schema errors |
| MC-02 | mission-index.json | Chronological order check | dateStart[n] ≤ dateStart[n+1] for all n |
| MC-03 | mission-index.json | Unique ID check | All IDs unique |
| MC-04 | mission-index.json | Unique version check | All versions unique; sequential |
| MC-05 | Apollo 1 entry | Safety flags present | `disaster-narrative` flag set |
| MC-06 | Challenger entry | Safety flags present | `disaster-narrative` flag set |
| MC-07 | Perseverance entry | Safety flags present | `biosignature-boundary` flag set |
| MC-08 | Predecessor/successor chain | Bidirectional check | A→B implies B←A for all pairs |

## Verification Gate

- [ ] mission-index.json validates against NASAMission JSON Schema
- [ ] ≥73 entries present
- [ ] All 6 epochs represented
- [ ] Strict chronological order verified by script
- [ ] No duplicate IDs or versions
- [ ] Bidirectional predecessor/successor chains verified
- [ ] README.md contains human-readable table matching JSON data

## Safety Boundaries

| Constraint | Boundary Type |
|-----------|---------------|
| Disaster missions (Apollo 1, Challenger, Columbia) must have `disaster-narrative` safety flag | ABSOLUTE |
| Mars science missions must have `biosignature-boundary` safety flag | ABSOLUTE |
| Planned/future missions must have `ongoing-mission` safety flag | GATE |
