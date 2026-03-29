# Safety Warden — Component Specification

**Milestone:** NASA Mission Series
**Wave:** 3 | **Track:** — (Critical path, sequential)
**Model Assignment:** Opus
**Estimated Tokens:** ~25K
**Dependencies:** All Wave 2 components
**Produces:** `skills/nasa/safety-warden/SKILL.md`, safety rule definitions, verification scripts, BLOCK enforcement logic

---

## Objective

Build the Safety Warden that enforces factual accuracy, sensitivity boundaries, and source quality across all NASA mission series content. The Warden operates in three modes (annotate, gate, redirect) with BLOCK authority that cannot be bypassed. Done means: the Warden catches incorrect disaster facts, unqualified biosignature claims, unsourced engineering data, and ITAR-adjacent content before any release.

## Context

The NASA mission series covers sensitive material: three major disasters that killed 17 people, ongoing scientific debates about extraterrestrial life, classified-adjacent technology, and engineering data that must be accurate. The Safety Warden is the last gate before any content reaches users. It cannot be bypassed, overridden, or demoted.

GSD Safety Warden pattern: three modes with monotonicity (children never relax parent boundaries).
- **Annotate:** Flag for awareness; content proceeds with note
- **Gate:** Confirm before proceeding; requires human review
- **Redirect:** Block content + suggest alternative; release halted

Safety boundaries are defined in the research reference (02-research-reference.md, Safety Boundaries section).

## Technical Specification

### Safety Rule Categories

**ABSOLUTE Rules (BLOCK on violation — no override):**

```yaml
absolute_rules:
  challenger_facts:
    description: "Challenger disaster narrative must use Rogers Commission findings"
    checks:
      - date: "1986-01-28"
      - cause: "O-ring failure in solid rocket booster field joint"
      - temperature: "Cold temperature (36°F / 2°C at launch)"
      - crew_count: 7
      - crew_names: ["Scobee", "Smith", "Resnik", "Onizuka", "McNair", "McAuliffe", "Jarvis"]
      - suspension: "32 months"
      - investigation: "Rogers Commission"
    action: "BLOCK if any fact incorrect"

  columbia_facts:
    description: "Columbia disaster narrative must use CAIB findings"
    checks:
      - date: "2003-02-01"
      - cause: "Foam insulation struck left wing leading edge during launch"
      - crew_count: 7
      - crew_names: ["Husband", "McCool", "Anderson", "Brown", "Chawla", "Clark", "Ramon"]
      - suspension: "29 months"
      - investigation: "Columbia Accident Investigation Board (CAIB)"
    action: "BLOCK if any fact incorrect"

  apollo1_facts:
    description: "Apollo 1 fire must honor crew and use factual findings"
    checks:
      - date: "1967-01-27"
      - cause: "Cabin fire in pure oxygen atmosphere during pad test"
      - crew_names: ["Grissom", "White", "Chaffee"]
      - program_halt: "18 months"
    action: "BLOCK if any fact incorrect"

  biosignature_boundary:
    description: "Mars life-detection claims restricted to 'potential biosignatures'"
    pattern_scan: "confirmed life|life found|life discovered|life detected|proof of life"
    allowed_language: "potential biosignatures|possible biosignatures|intriguing signatures"
    action: "BLOCK if prohibited patterns found"

  itar_exclusion:
    description: "No classified or export-controlled data"
    checks:
      - no_classified_markings: true
      - all_sources_public: true
      - no_itar_technical_data: true
    action: "BLOCK if any check fails"

  source_quality:
    description: "All sources must be government or peer-reviewed"
    prohibited_sources: ["blog", "entertainment media", "forum", "social media", "unsourced claim"]
    action: "BLOCK if prohibited source type found in bibliography"

  no_editorial_disasters:
    description: "Disaster sections contain zero opinion sentences"
    pattern_scan: "management should have|negligence|cover-up|blame|fault"
    exception: "Direct quotes from Rogers Commission or CAIB reports"
    action: "BLOCK if opinion language found outside direct investigation quotes"
```

**GATE Rules (require human review):**

```yaml
gate_rules:
  engineering_parameters:
    description: "Numerical engineering values must cite source or mark [representative]"
    check: "Every number in Part D has either a citation or '[representative value]' tag"
    action: "Gate — human reviews uncited values before release"

  astronaut_medical:
    description: "No speculation on individual astronaut health"
    check: "Medical content uses only published NASA selection criteria"
    action: "Gate — human reviews medical content"

  budget_political:
    description: "Budget and political content uses GAO/NASA sources only"
    check: "No advocacy language; factual reporting only"
    action: "Gate — human reviews political content"

  cultural_sensitivity:
    description: "Missions referencing Indigenous lands trigger OCAP/CARE review"
    check: "If mission location overlaps Indigenous territory, review activated"
    action: "Gate — cultural review before release"
```

**ANNOTATE Rules (flag for awareness, content proceeds):**

```yaml
annotate_rules:
  artemis_flux:
    description: "Artemis program details may change"
    check: "Artemis content flagged with currency date"
    action: "Annotate — 'Information current as of [date]'"

  career_salary:
    description: "Salary data should be dated"
    check: "BLS data includes year of data"
    action: "Annotate — 'Salary data from BLS [year]'"

  ongoing_mission:
    description: "Active mission status may change"
    check: "Content about active missions flagged"
    action: "Annotate — 'Mission status as of [date]'"
```

### Verification Scripts

```bash
# scripts/nasa/safety-check.sh
# Runs all safety checks against a mission's pipeline output
# Usage: scripts/nasa/safety-check.sh <mission-id>

# Checks:
# 1. Disaster fact verification (grep + compare against known-good values)
# 2. Biosignature language scan (grep for prohibited patterns)
# 3. Source quality scan (verify all bibliography entries are gov/peer)
# 4. Engineering parameter audit (flag uncited numbers)
# 5. Editorial language scan (grep for opinion patterns in disaster sections)
# 6. ITAR exclusion check (no classified markings)
```

### Behavioral Requirements

- Safety Warden runs on EVERY part of EVERY release, not just at the end
- BLOCK actions halt the pipeline immediately; escalate to CAPCOM
- BLOCK actions cannot be overridden by any agent (including FLIGHT)
- Only CAPCOM (human) can resolve a BLOCK by correcting the content and re-running the check
- Safety rules are additive across releases (new rules from retrospectives are added, never removed)
- Safety Warden logs all actions (annotate, gate, redirect) in release notes

## Implementation Steps

1. Create `skills/nasa/safety-warden/SKILL.md` with all rule definitions
2. Implement absolute rule checks as scripts (disaster facts, biosignature, ITAR, source quality)
3. Implement gate rules as human-review triggers
4. Implement annotate rules as automatic content tagging
5. Build BLOCK enforcement (pipeline halt + CAPCOM escalation)
6. Test: feed known-bad content (wrong Challenger date); verify BLOCK issued

## Test Cases

| Test ID | Input | Expected Output | Pass Condition |
|---------|-------|-----------------|----------------|
| SW-01 | Challenger date "January 29, 1986" | BLOCK issued | Pipeline halted; correct date cited |
| SW-02 | "Life confirmed on Mars" in Part B | BLOCK issued | Biosignature boundary violated |
| SW-03 | Blog cited as source | BLOCK issued | Source quality rule triggered |
| SW-04 | "Management was negligent" in disaster section | BLOCK issued | Editorial language detected |
| SW-05 | Uncited engineering value "stress = 450 MPa" | GATE triggered | Human review requested |
| SW-06 | Artemis III date mentioned | ANNOTATE added | "Information current as of [date]" tag |
| SW-07 | All content correct and sourced | No actions | Release proceeds; log shows "all checks passed" |
| SW-08 | Attempt to override BLOCK | Override fails | BLOCK persists; CAPCOM escalation required |

## Verification Gate

- [ ] All absolute rules implemented with automated checks
- [ ] BLOCK halts pipeline and escalates to CAPCOM
- [ ] BLOCK cannot be overridden by any non-human agent
- [ ] Gate rules trigger human review workflow
- [ ] Annotate rules add tags without halting pipeline
- [ ] Safety Warden actions logged in release notes
- [ ] Known-bad test cases (SC-01 through SC-12 from test plan) all caught

## Safety Boundaries

This component IS the safety boundary enforcement mechanism. Its own constraint:

| Constraint | Boundary Type |
|-----------|---------------|
| Safety Warden rules are additive — new rules added, never removed | ABSOLUTE |
| Safety Warden cannot be disabled or bypassed | ABSOLUTE |
| Only human CAPCOM can resolve BLOCKs | ABSOLUTE |
