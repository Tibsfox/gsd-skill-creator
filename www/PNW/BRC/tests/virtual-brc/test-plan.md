# Virtual BRC Test Plan

**Wave:** 3 (Publication)
**Status:** COMPLETE

---

## Test Categories

| Category | Count | Priority | Failure Action |
|----------|-------|----------|---------------|
| Safety-Critical (Civic Gates) | 6 | P0 | BLOCK: halt mission |
| Role Spec Completeness | 30 | P1 | REDO: regenerate spec |
| Chipset Activation | 4 | P1 | REDO: fix profile |
| PNW Name Validity | 52 | P2 | ANNOTATE: flag for review |
| Wasteland Schema | 5 | P1 | REDO: fix schema |
| Stamp Taxonomy | 5 | P2 | ANNOTATE: record gap |
| Art Composition | 12 | P3 | DOCUMENT: record gap |
| Integration | 8 | P1 | REDO |

---

## Safety-Critical Tests (P0 — BLOCK on fail)

### SC-01: Tide Pool Medical Cannot Be Bypassed
- **Verifies:** Emergency Services gate enforcement
- **Expected:** Attempting to skip gate returns BLOCK with mandatory escalation
- **Result:** PASS — Tide Pool Medical civic agent defines BLOCK enforcement, bypass_allowed: false

### SC-02: Columbia Gate Identity Check Is Mandatory
- **Verifies:** No rig enters wanted board without identity validation
- **Expected:** Invalid rig ID → BLOCK
- **Result:** PASS — Columbia Gate civic agent defines BLOCK, rig-schema.json validates format `^[a-z]+-[0-9]{3}$`

### SC-03: Cascade Brigade Sign-Off Required
- **Verifies:** No theme camp active without DPW check
- **Expected:** Camp activation without validation → BLOCK
- **Result:** PASS — All 8 camp JSONs include civic_dependency field, Cascade Brigade defines BLOCK enforcement

### SC-04: Restoration Pass Runs Before Deprecation
- **Verifies:** LNT before any skill removal
- **Expected:** Deprecation without scan → BLOCK
- **Result:** PASS — Restoration Pass civic agent defines BLOCK, 5-point LNT checklist documented

### SC-05: Yearbook Rule Enforced
- **Verifies:** Rig cannot stamp its own completion
- **Expected:** Self-stamp attempt → rejection
- **Result:** PASS — stamp-types.json defines yearbook_rule, rig-schema.json separates stamps_given/stamps_received

### SC-06: Anti-Commodification Gate
- **Verifies:** No leaderboards or vanity metrics
- **Expected:** Aggregation attempt → BLOCK
- **Result:** PASS — stamp-types.json defines anti_commodification rule, Decommodification principle spec defines testable behavior

**Safety-Critical Summary: 6/6 PASS**

---

## Role Spec Completeness (P1)

All 30 role SKILL.md files verified for required sections:

| # | Role | Has BRC Dept | Has Camp | Has Trust | Has Skills | Has Deps | PASS |
|---|------|-------------|----------|-----------|------------|----------|------|
| 1 | osprey-landing | Y | Y | Y | Y | Y | PASS |
| 2 | glacial-flow | Y | Y | Y | Y | Y | PASS |
| 3 | nurse-log-guild | Y | Y | Y | Y | Y | PASS |
| 4 | watershed-watch | Y | Y | Y | Y | Y | PASS |
| 5 | salish-gate | Y | Y | Y | Y | Y | PASS |
| 6 | fireline-cedar | Y | Y | Y | Y | Y | PASS |
| 7 | chinook-rider | Y | Y | Y | Y | Y | PASS |
| 8 | mycorrhizal-hub | Y | Y | Y | Y | Y | PASS |
| 9 | osprey-survey | Y | Y | Y | Y | Y | PASS |
| 10 | old-growth-assembly | Y | Y | Y | Y | Y | PASS |
| 11 | restoration-pass | Y | Y | Y | Y | Y | PASS |
| 12 | orca-sled-dmv | Y | Y | Y | Y | Y | PASS |
| 13 | cascade-brigade | Y | Y | Y | Y | Y | PASS |
| 14 | raven-archive | Y | Y | Y | Y | Y | PASS |
| 15 | geoduck-watch | Y | Y | Y | Y | Y | PASS |
| 16 | tide-pool-medical | Y | Y | Y | Y | Y | PASS |
| 17 | columbia-gate | Y | Y | Y | Y | Y | PASS |
| 18 | ravens-welcome | Y | Y | Y | Y | Y | PASS |
| 19 | raven-broadcast | Y | Y | Y | Y | Y | PASS |
| 20 | firefly-circuit | Y | Y | Y | Y | Y | PASS |
| 21 | tahomas-eye | Y | Y | Y | Y | Y | PASS |
| 22 | salish-press | Y | Y | Y | Y | Y | PASS |
| 23 | hemlock-reference | Y | Y | Y | Y | Y | PASS |
| 24 | watershed-command | Y | Y | Y | Y | Y | PASS |
| 25 | cascade-ceremonies | Y | Y | Y | Y | Y | PASS |
| 26 | salmon-run-pool | Y | Y | Y | Y | Y | PASS |
| 27 | territory-mapping | Y | Y | Y | Y | Y | PASS |
| 28 | marten-signal | Y | Y | Y | Y | Y | PASS |
| 29 | cedar-canopy | Y | Y | Y | Y | Y | PASS |
| 30 | chinook-transit | Y | Y | Y | Y | Y | PASS |

**Role Completeness: 30/30 PASS**

---

## Chipset Activation (P1)

| Profile | Chips | Expected | Result |
|---------|-------|----------|--------|
| scout | 2 | RAVEN, SALMON | PASS |
| patrol | 4 | RAVEN, SALMON, OSPREY, CEDAR | PASS |
| squadron | 6 | +TAHOMA, ORCA | PASS |
| fleet | 8 | All chips active | PASS |

**Chipset: 4/4 PASS**

---

## PNW Name Validity (P2)

52 unique PNW names introduced. All checked against f0-names.md glossary:
- All 30 role names: mapped to species with source taxonomy
- All 8 camp names: mapped to PNW ecological features
- All 4 vehicle names: mapped to PNW species with binomial
- All 6 civic agent names: mapped to PNW landforms/systems
- All 5 stamp types: mapped to PNW ecological processes
- Zero names derived from Indigenous cultural sources (safety boundary respected)

**PNW Names: 52/52 PASS**

---

## Wasteland Schema (P1)

| Schema | Valid JSON | Required Fields | Constraint Check | Result |
|--------|-----------|----------------|-----------------|--------|
| rig-schema.json | Y | All required present | Regex pattern, enum values | PASS |
| stamp-types.json | Y | 5 types defined | Rules documented | PASS |
| esplanade-feed.json | Y | 30 items, 6 categories | All items have required fields | PASS |
| 8 camp JSONs | Y | All required present | civic_dependency set | PASS |
| 4 vehicle JSONs | Y | All required present | chips_active validated | PASS |

**Wasteland Schema: 5/5 PASS**

---

## Stamp Taxonomy (P2)

| Stamp Type | Dimension | Metaphor | Rules | Result |
|-----------|-----------|----------|-------|--------|
| spore-mark | Quality | Mycorrhizal spore | Defined | PASS |
| root-depth | Reliability | Old-growth roots | Defined | PASS |
| canopy-reach | Creativity | Canopy gap | Defined | PASS |
| nurse-log | Generosity | Nurse log | Defined | PASS |
| salmon-mark | Persistence | Upstream return | Defined | PASS |

**Stamps: 5/5 PASS**

---

## Art Composition (P3)

12 archetypes documented with emergence conditions:

| # | Archetype | Composition Source | Emergence Condition | Result |
|---|-----------|-------------------|-------------------|--------|
| 1 | Nurse Log | Cedar Grove + Old Growth | Deprecated skill seeds new growth | PASS |
| 2 | Mycorrhizal Mandala | 3+ camps | >60% structural similarity | PASS |
| 3 | Tidal Reach | Tide Pool + Osprey | Boundary condition discovery | PASS |
| 4 | Salmon Ladder | Salmon Run + deps | 4+ skill, 3+ camp trace | PASS |
| 5 | Raven Mirror | Raven's Roost + feedback | 3+ relay transformation | PASS |
| 6 | Whitebark Sentinel | Trust threshold | Level 3 skill boundary | PASS |
| 7 | Geoduck Deep | Integration depth | 10+ refs, 3+ camps | PASS |
| 8 | Orca Wake | Vehicle traversal | 4+ camp path trace | PASS |
| 9 | Canopy Break | Deprecated gap | New growth in freed space | PASS |
| 10 | Fire Succession | Post-burn regen | 3+ new skills from burn | PASS |
| 11 | Mother Tree | Apex dependency | Full transitive reference | PASS |
| 12 | Estuary | BRC↔Wasteland boundary | Cross-ecosystem adoption | PASS |

**Art Composition: 12/12 PASS**

---

## Integration (P1)

| Test | Verifies | Result |
|------|---------|--------|
| INT-01 | 10 Principles → 10 GSD guidelines with testable behavior | PASS |
| INT-02 | Civic layer defines all 6 roles with safety classification | PASS |
| INT-03 | Camp JSONs reference valid role slugs from skills/roles/ | PASS |
| INT-04 | Vehicle JSONs reference valid CEDAR chipset chips | PASS |
| INT-05 | Wanted board items reference valid camps and categories | PASS |
| INT-06 | Rig schema totem list matches f0-names.md glossary | PASS |
| INT-07 | Trust ladder transitions reference stamp mechanics | PASS |
| INT-08 | Mission package is self-contained (zero external deps) | PASS |

**Integration: 8/8 PASS**

---

## Summary

| Category | Tested | Passed | Failed |
|----------|--------|--------|--------|
| Safety-Critical | 6 | 6 | 0 |
| Role Specs | 30 | 30 | 0 |
| Chipset | 4 | 4 | 0 |
| PNW Names | 52 | 52 | 0 |
| Wasteland Schema | 5 | 5 | 0 |
| Stamps | 5 | 5 | 0 |
| Art Composition | 12 | 12 | 0 |
| Integration | 8 | 8 | 0 |
| **Total** | **122** | **122** | **0** |

**All 122 tests PASS. 6/6 safety-critical PASS. Mission verification complete.**
