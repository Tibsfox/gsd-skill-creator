# Cooking with Claude — Test Plan

**Total Tests:** 86 | **Safety-Critical:** 14 | **Target Coverage:** 85%+

## Test Categories

| Category | Count | Priority | Failure Action |
|----------|-------|----------|---------------|
| Safety-critical (food safety, bounded learning) | 14 | Mandatory | BLOCK |
| Core functionality (Rosetta Core, College, Calibration) | 32 | Required | BLOCK |
| Integration (cross-component, observation pipeline) | 18 | Required | BLOCK |
| Panel correctness (language output accuracy) | 14 | Required | BLOCK |
| Edge cases (token overflow, missing data, circular deps) | 8 | Best-effort | LOG |

## Safety-Critical Tests (Mandatory Pass — Zero Tolerance)

| Test ID | Verifies | Expected Behavior | Component |
|---------|----------|-------------------|-----------|
| SC-01 | Poultry temp floor | Calibration NEVER suggests internal temp < 165°F/74°C for poultry | Safety Warden |
| SC-02 | Ground meat temp floor | Calibration NEVER suggests internal temp < 160°F/71°C for ground meat | Safety Warden |
| SC-03 | Beef/pork temp floor | Calibration NEVER suggests internal temp < 145°F/63°C for whole cuts | Safety Warden |
| SC-04 | Danger zone time | System warns when food has been in 40-140°F zone for >2 hours | Safety Warden |
| SC-05 | Allergen flagging | Ingredient substitution always flags allergen implications | Safety Warden |
| SC-06 | Storage time limits | System warns when refrigerated leftovers exceed 4 days | Safety Warden |
| SC-07 | Redirect mode blocks | Safety Warden in redirect mode never exposes unsafe temperature | Safety Warden |
| SC-08 | Gate mode requires ack | Safety Warden in gate mode pauses for user acknowledgment | Safety Warden |
| SC-09 | 20% bounded learning | No single calibration step changes parameters by >20% | Calibration Engine |
| SC-10 | Token budget ceiling | Panel loading never exceeds 5% of context window | College Loader |
| SC-11 | No safety panel suppression | Panel router never suppresses safety-relevant panels | Rosetta Core |
| SC-12 | Math accuracy — Python | Python panel code produces mathematically correct results | Python Panel |
| SC-13 | Math accuracy — C++ | C++ panel code produces mathematically correct results | C++ Panel |
| SC-14 | DAG enforcement | Circular concept dependencies detected and rejected | Concept Registry |

## Core Functionality Tests

### Rosetta Core (8 tests)
| Test ID | Verifies | Expected Behavior |
|---------|----------|-------------------|
| RC-01 | Basic translation | Concept rendered correctly in requested panel |
| RC-02 | Panel routing — explicit | User-requested panel overrides routing logic |
| RC-03 | Panel routing — expertise | Expert context prefers systems panels |
| RC-04 | Panel routing — exploration | Suggests unseen panels for exploration tasks |
| RC-05 | Concept registration | New concepts stored and retrievable |
| RC-06 | Dependency resolution | Prerequisites loaded before dependent concepts |
| RC-07 | Cross-domain analogy | Math concept returns cooking analogy |
| RC-08 | Expression depth levels | Summary < Active < Deep in token cost |

### College Structure (8 tests)
| Test ID | Verifies | Expected Behavior |
|---------|----------|-------------------|
| CS-01 | Summary load | Department summary loads in <3K tokens |
| CS-02 | Wing load | Wing loads all concepts in <12K tokens |
| CS-03 | Deep load | Deep reference loads extended content |
| CS-04 | Exploration triggers observation | explore() triggers skill-creator observation pipeline |
| CS-05 | Cross-department navigation | Math→Cooking cross-references resolve correctly |
| CS-06 | Learning path validity | No missing prerequisites in suggested order |
| CS-07 | New department extensibility | Adding stub department requires no framework changes |
| CS-08 | Try-session completability | "First meal" try-session completable by novice |

### Calibration Engine (8 tests)
| Test ID | Verifies | Expected Behavior |
|---------|----------|-------------------|
| CE-01 | Full cycle | Observe→Compare→Adjust→Record completes successfully |
| CE-02 | Cooking model — temperature | "Overdone" feedback reduces temperature suggestion |
| CE-03 | Cooking model — texture | "Too dry" feedback adjusts liquid ratio |
| CE-04 | Cooking model — crust | "No crust" feedback diagnoses surface moisture |
| CE-05 | Delta persistence | Calibration deltas survive session restart |
| CE-06 | Profile synthesis | Multiple deltas combine into coherent profile |
| CE-07 | Confidence scoring | Repeated consistent feedback increases confidence |
| CE-08 | Bounded adjustment | Large feedback capped at 20% change |

### Cooking Department (8 tests)
| Test ID | Verifies | Expected Behavior |
|---------|----------|-------------------|
| CD-01 | All 7 wings load | Each wing loads and renders concepts |
| CD-02 | Food science accuracy | Maillard reaction onset temp correct (140°C) |
| CD-03 | Baker's percentages | Ratio calculations correct for test recipes |
| CD-04 | Technique classification | Correct wet/dry/combination categorization |
| CD-05 | Nutrition data | Macronutrient values within USDA tolerance |
| CD-06 | Altitude adjustments | Correct adjustments for 5,000 ft altitude |
| CD-07 | Safe storage times | Correct USDA refrigerator/freezer times |
| CD-08 | Home economics — cost per serving | Calculation correct for test meal plan |

## Integration Tests

| Test ID | Interface Between | Expected Behavior |
|---------|-------------------|-------------------|
| INT-01 | Rosetta Core → College | translate() loads concepts from College framework |
| INT-02 | College → Observation Pipeline | Concept exploration triggers pattern detection |
| INT-03 | Calibration → Delta Store | Feedback persists and retrieves correctly |
| INT-04 | Safety Warden → Calibration | Safety boundaries override calibration suggestions |
| INT-05 | Panel Router → Token Budget | Panel selection respects token budget |
| INT-06 | Chipset → Rosetta Core | Chipset configuration routes to correct agents |
| INT-07 | Math Dept → Cooking Dept | Cross-references navigate between departments |
| INT-08 | Lisp Panel → Concept Registry | Concept IS manipulable S-expression data |
| INT-09 | Calibration → User Profile | Profile accumulates across multiple sessions |
| INT-10 | College Loader → Progressive Disclosure | Summary→Active→Deep tiers load correctly |
| INT-11 | Try-Session → Calibration | Completing try-session creates initial calibration data |
| INT-12 | Safety Warden (annotate) | Annotate mode flags without blocking |
| INT-13 | Safety Warden (gate) | Gate mode pauses for acknowledgment |
| INT-14 | Safety Warden (redirect) | Redirect mode substitutes safe alternative |
| INT-15 | Panel Router → Complex Plane | Concept position influences panel selection |
| INT-16 | Fortran Panel → Math Dept | Scientific computing concepts render in Fortran |
| INT-17 | Pascal Panel → Pedagogy | Pascal panel annotations teach Wirth's principles |
| INT-18 | End-to-end cooking workflow | User asks "why are my cookies flat?" → correct diagnosis |

## Panel Correctness Tests

| Test ID | Panel | Verifies |
|---------|-------|----------|
| PAN-01 | Python | Exponential decay: `math.exp()` produces correct values |
| PAN-02 | C++ | Exponential decay: `std::exp()` produces correct values |
| PAN-03 | Java | Exponential decay: `Math.exp()` produces correct values |
| PAN-04 | Lisp | Exponential decay: `(exp)` produces correct values |
| PAN-05 | Pascal | Exponential decay: `Exp()` produces correct values |
| PAN-06 | Fortran | Exponential decay: `EXP()` produces correct values |
| PAN-07 | Python | Trig functions: `math.sin/cos/tan` correct for test angles |
| PAN-08 | C++ | Trig functions: `cmath` correct for test angles |
| PAN-09 | Lisp | Homoiconicity: concept definition IS inspectable list |
| PAN-10 | Pascal | Structured programming: proper begin/end, typed variables |
| PAN-11 | Fortran | Scientific notation: correct REAL precision |
| PAN-12 | All | Pedagogical notes present and non-empty |
| PAN-13 | All | Token cost estimate within 20% of actual |
| PAN-14 | All | Cross-reference links valid |

## Edge Case Tests

| Test ID | Scenario | Expected Behavior |
|---------|----------|-------------------|
| EDGE-01 | Token overflow | Graceful truncation with "load more" indicator |
| EDGE-02 | Missing concept | ConceptNotFoundError with helpful message |
| EDGE-03 | Missing panel | Falls back to next best panel, logs warning |
| EDGE-04 | Empty feedback | No calibration change, acknowledgment only |
| EDGE-05 | Contradictory feedback | Lower confidence score, suggest clarification |
| EDGE-06 | Extremely long session | Delta store handles 100+ calibration records |
| EDGE-07 | New department with zero concepts | Loads without error, shows empty state |
| EDGE-08 | Simultaneous panel requests | All panels render without conflict |

## Verification Matrix

| Success Criterion (from Vision) | Test ID(s) | Status |
|--------------------------------|-----------|--------|
| 1. Rosetta Core translates across 3+ panels | RC-01, PAN-01 through PAN-06 | |
| 2. Exploring code teaches the subject | CS-04, INT-02 | |
| 3. Calibration adjusts cooking parameters | CE-02, CE-03, CE-04, INT-18 | |
| 4. Food science accuracy | CD-02, CD-03, CD-05, CD-06, CD-07 | |
| 5. Safety never overridden | SC-01 through SC-08, INT-04 | |
| 6. Novice can complete first meal | CS-08, INT-18 | |
| 7. New departments without modifying core | CS-07, EDGE-07 | |
| 8. Token budget respected | SC-10, INT-05, INT-10 | |
| 9. Calibration pattern reusable | CE-01, CE-08 | |
| 10. Math↔Cooking cross-references | CS-05, INT-07, RC-07 | |
| 11. Fox food — system builds itself | INT-01, INT-02 | |
| 12. 5+ sessions improve calibration | CE-06, CE-07, INT-09 | |
