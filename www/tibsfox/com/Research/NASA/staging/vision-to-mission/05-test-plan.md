# NASA Mission Series — Test Plan

**Total Tests:** 48 | **Safety-Critical:** 12 | **Target Coverage:** 90%+
**Test density target:** 2–4 tests per success criterion

---

## Test Categories

| Category | Count | Priority | Failure Action |
|----------|-------|----------|----------------|
| Safety-critical | 12 | P0 Mandatory | BLOCK release |
| Core functionality | 18 | P1 Required | BLOCK release |
| Integration | 10 | P2 Required | BLOCK release |
| Edge cases | 8 | P3 Best-effort | LOG + review |

---

## Safety-Critical Tests (Mandatory Pass — BLOCK on Failure)

| Test ID | Verifies | Expected Behavior | Component |
|---------|----------|-------------------|-----------|
| SC-01 | Challenger disaster facts | O-ring failure in SRB joint; cold temperature; January 28, 1986; 7 crew killed; names correct; 32-month suspension; Rogers Commission cited | Safety Warden |
| SC-02 | Columbia disaster facts | Foam strike to left wing leading edge; February 1, 2003; 7 crew killed; names correct; 29-month suspension; CAIB cited | Safety Warden |
| SC-03 | Apollo 1 fire facts | Pure O₂ atmosphere; January 27, 1967; Grissom, White, Chaffee killed; 18-month halt; no editorializing | Safety Warden |
| SC-04 | Mars biosignature boundary | All Mars life-detection language uses "potential biosignatures" only; zero instances of "confirmed life" or "life found" in any output | Safety Warden |
| SC-05 | ITAR/classified exclusion | No classified or export-controlled data present in any output; all sources from NASA open data only | Safety Warden |
| SC-06 | Engineering parameter sourcing | Every numerical engineering value either cites a published source OR is explicitly marked "[representative value]" | Safety Warden |
| SC-07 | Disaster narrative no-editorial | Disaster sections contain zero opinion sentences; only factual findings from Rogers/CAIB/investigation reports | Safety Warden |
| SC-08 | Safety Warden BLOCK authority | When presented with incorrect Challenger date (test: "January 29, 1986"), Safety Warden issues BLOCK; release halted | Safety Warden |
| SC-09 | Safety Warden cannot be bypassed | Attempting to release without Safety Warden approval fails; no override mechanism exists | Safety Warden |
| SC-10 | Cultural sensitivity gate | Missions referencing Indigenous lands trigger OCAP/CARE review gate; no content proceeds without gate clearance | Safety Warden |
| SC-11 | Astronaut medical boundary | No speculation on individual astronaut health conditions; only published NASA selection criteria and standards | Safety Warden |
| SC-12 | Source quality enforcement | Zero instances of blog, entertainment media, or unsourced claims in any Part A-H output; all sources government/peer-reviewed | Safety Warden |

---

## Core Functionality Tests

### Branch Infrastructure Tests
| Test ID | Verifies | Input | Expected Output |
|---------|----------|-------|-----------------|
| CF-BI-01 | Branch creation | `scripts/create-nasa-branch.sh` | nasa branch exists; based on main HEAD; push.default=nothing |
| CF-BI-02 | Directory skeleton | Wave 0 skeleton creation | All required directories exist: docs/nasa/, skills/nasa/, chipsets/nasa/, college/nasa/, docs/TSPB/ |

### Mission Catalog Tests
| Test ID | Verifies | Input | Expected Output |
|---------|----------|-------|-----------------|
| CF-MC-01 | Catalog completeness | mission-index.json | ≥73 entries; all 6 epochs represented; chronological order |
| CF-MC-02 | Schema validation | Each catalog entry | Valid against nasa-mission.ts schema; all required fields present |
| CF-MC-03 | Version mapping | Catalog entries | Every entry has unique version number; no gaps in sequence |

### Per-Mission Pipeline Tests
| Test ID | Verifies | Input | Expected Output |
|---------|----------|-------|-----------------|
| CF-PP-01 | Part A output | v1.0 mission data | Historical narrative ≥2000 words; mission timeline table; hardware table; source bibliography |
| CF-PP-02 | Part B output | v1.0 Part A | Science findings documented; instruments listed; data products identified |
| CF-PP-03 | Part C output | v1.0 Part B | ≥1 TRY Session; ≥1 DIY project; College of Knowledge format |
| CF-PP-04 | Part D output | v1.0 Part B | Five engineering pillars addressed; ≥1 worked derivation; TSPB cross-reference |
| CF-PP-05 | Part E output | v1.0 Parts B+D | Simulation specification present; at least one platform (Python/Minecraft/Blender) |
| CF-PP-06 | Part F output | v1.0 Parts A-E | Operations architecture documented; CAPCOM context present |
| CF-PP-07 | Part G output | v1.0 Parts A-F | 8 passes documented; ≥1 lesson classified; template delta if applicable |
| CF-PP-08 | Part H output | v1.0 Parts A-G | ≥1 NASA API integration; working sample query; upstream registration |

### Release Cadence Tests
| Test ID | Verifies | Input | Expected Output |
|---------|----------|-------|-----------------|
| CF-RC-01 | Release notes generation | v1.0 pipeline output | Release notes match template; all sections present; metrics populated |
| CF-RC-02 | Version tagging | Release completion | Git tag nasa-v1.0 created; tag points to correct commit |

### Retrospective Tests
| Test ID | Verifies | Input | Expected Output |
|---------|----------|-------|-----------------|
| CF-RT-01 | Retrospective generation | v1.0 complete output | Retrospective document with classified lessons; forward links |
| CF-RT-02 | Lessons forward-linking | v1.0 retrospective | v1.1 pre-flight check loads v1.0 lessons; specific lessons cited |

### Factory Tests
| Test ID | Verifies | Input | Expected Output |
|---------|----------|-------|-----------------|
| CF-FA-01 | Skill generation | Mission content | Valid SKILL.md with trigger description, domain, evaluation harness |
| CF-FA-02 | Iterative improvement | Retrospective finding "improve trigger" | Existing skill's trigger description updated; change ≤20%; documented |

---

## Integration Tests

| Test ID | Interface Between | Scenario | Expected Behavior |
|---------|------------------|----------|-------------------|
| IT-01 | Catalog → Pipeline | Pipeline requests next mission | Correct mission data returned in chronological order |
| IT-02 | Pipeline → Release | Pipeline completes all parts | Release engine generates notes, creates tag, pushes |
| IT-03 | Release → Sync | Release tagged | Sync engine fetches main, merges, reports status |
| IT-04 | Sync → Next Release | Sync complete | Next release pre-flight loads merged state + previous retro |
| IT-05 | Pipeline → Factory | Part A-F content produced | Factory identifies ≥1 skill candidate from content |
| IT-06 | Factory → Registry | New skill generated | Skill appears in skill registry; trigger description evaluates correctly |
| IT-07 | Part H → Part E | NASA API data retrieved | Simulation specification references real data source |
| IT-08 | Safety Warden → All Parts | Incorrect fact in Part A | Safety Warden catches; BLOCK issued; release halted |
| IT-09 | Retro → Templates | Template improvement identified | Next release uses improved template; improvement traceable |
| IT-10 | Pipeline → College | Educational content produced | Content filed in correct College of Knowledge department |

---

## Edge Cases

| Test ID | Scenario | Expected Behavior |
|---------|----------|-------------------|
| EC-01 | Main sync with conflicts | Conflicts documented; manual resolution steps provided; sync marked "conflicts resolved" in release notes |
| EC-02 | NASA API temporarily unavailable | Part H gracefully degrades; notes "API unavailable at execution time"; provides cached/alternative data |
| EC-03 | Mission with classified elements | Safety Warden flags classified content; Part H excludes ITAR data; annotation added |
| EC-04 | Grouped missions (e.g., Gemini 9A-12) | Pipeline handles multi-mission entries; individual sub-missions documented within single release |
| EC-05 | Future/planned missions (Artemis III+) | Language appropriately tentative; dates marked "planned"; sources current as of execution date |
| EC-06 | Mission with no science payload | Part B abbreviated; Parts C and E adjusted; pipeline does not fail on missing science |
| EC-07 | Retrospective identifies zero improvements | Valid outcome; retrospective documents "no changes needed"; does not force unnecessary changes |
| EC-08 | Version sequence after grouped missions | Version numbers remain sequential; no gaps; catalog index updated if missions split during execution |

---

## Verification Matrix

*Maps every success criterion from the vision doc to the tests that verify it.*

| Success Criterion | Test IDs | Status |
|-------------------|----------|--------|
| 1. Developer clones repo, finds indexed catalog with study guides | CF-MC-01, CF-MC-02, CF-PP-01, IT-10 | Pending |
| 2. Each release includes verbose release notes | CF-RC-01, CF-RC-02 | Pending |
| 3. Retrospective from N improves N+1 | CF-RT-01, CF-RT-02, IT-09 | Pending |
| 4. ≥10 new skills in first 20 releases | CF-FA-01, CF-FA-02, IT-06 | Pending |
| 5. ≥3 new agent roles/team topologies emerge | CF-FA-01, IT-05 | Pending |
| 6. Part D includes worked mathematical derivation | CF-PP-04, SC-06 | Pending |
| 7. Part H produces ≥1 integration skill per epoch | CF-PP-08, IT-07 | Pending |
| 8. Safety Warden blocks unverified content | SC-01 through SC-12, IT-08 | Pending |
| 9. Part G produces ≥5 template improvements in first 10 releases | CF-PP-07, CF-RT-01, IT-09 | Pending |
| 10. Main sync completes cleanly or with documented resolution | IT-03, EC-01 | Pending |
| 11. Each mission has ≥1 TRY Session and ≥1 DIY project | CF-PP-03, IT-10 | Pending |
| 12. Complete series is standalone educational resource | CF-MC-01, CF-PP-01 through CF-PP-08, IT-10 | Pending |
