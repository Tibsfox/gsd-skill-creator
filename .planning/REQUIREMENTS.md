# Requirements: gsd-skill-creator

**Defined:** 2026-03-01
**Core Value:** Skills are discovered from real patterns and proved against mathematical foundations

## v1.49.8 Requirements

Requirements for Cooking With Claude milestone. Each maps to roadmap phases.

### Rosetta Core

- [ ] **CORE-01**: Concept Registry stores canonical concept definitions with panel mappings and dependency resolution
- [ ] **CORE-02**: Panel Router selects appropriate expression panel based on user context, domain, and requested format
- [ ] **CORE-03**: Expression Renderer produces formatted output from panel-specific expressions
- [ ] **CORE-04**: Rosetta Core translates the same concept correctly across 3+ panels
- [ ] **CORE-05**: Panel Interface defines standard contract that all language panels implement

### Panels

- [ ] **PANEL-01**: Python panel implements PanelInterface with math library bindings, expression templates, and pedagogical annotations
- [ ] **PANEL-02**: C++ panel implements PanelInterface with cmath bindings, expression templates, and pedagogical annotations
- [ ] **PANEL-03**: Java panel implements PanelInterface with Math class bindings, expression templates, and pedagogical annotations
- [ ] **PANEL-04**: Lisp panel demonstrates homoiconicity — concept definitions ARE manipulable data structures
- [ ] **PANEL-05**: Pascal panel encodes Wirth's pedagogical principles (simplicity, modularity, structured control flow)
- [ ] **PANEL-06**: Fortran panel expresses scientific computing heritage (array operations, numerical methods)
- [ ] **PANEL-07**: Perl panel demonstrates text processing, regex-as-syntax, closure factories, POD-as-curriculum
- [ ] **PANEL-08**: ALGOL panel demonstrates BNF notation, block structure, three-syntax architecture (ancestor panel)
- [ ] **PANEL-09**: Unison panel demonstrates content-addressed code, hash-based identity, algebraic effects (frontier panel)

### College Structure

- [ ] **COLL-01**: College framework loads departments with progressive disclosure (summary <3K, active <12K, deep 50K+)
- [ ] **COLL-02**: Department/wing/concept hierarchy is navigable and explorable as code
- [ ] **COLL-03**: Try-session runner supports interactive entry points for each department
- [ ] **COLL-04**: Cross-reference resolver links concepts across departments
- [ ] **COLL-05**: Adding a new department requires no modifications to the College framework

### Mathematics Department

- [ ] **MATH-01**: Mathematics Department seeded with concepts from "The Space Between" (exponential growth/decay, trig functions, complex numbers, fractal geometry)
- [ ] **MATH-02**: Math concepts render correctly in all active panels (Python, C++, Java, Lisp, Pascal, Fortran)
- [ ] **MATH-03**: Unit circle architecture integration — concepts positioned on Complex Plane of Experience

### Calibration Engine

- [ ] **CAL-01**: Universal Observe→Compare→Adjust→Record loop completes full cycle
- [ ] **CAL-02**: CalibrationModel interface supports domain-specific science models
- [ ] **CAL-03**: Delta persistence — calibration deltas survive session restart
- [ ] **CAL-04**: Profile synthesis — multiple deltas combine into coherent user profile
- [ ] **CAL-05**: Confidence scoring — repeated consistent feedback increases confidence
- [ ] **CAL-06**: Bounded adjustment — no single calibration step changes parameters by more than 20%

### Cooking Department

- [ ] **COOK-01**: Food Science wing with concepts for Maillard reactions, emulsification, protein denaturation, starch gelatinization, caramelization, fermentation
- [ ] **COOK-02**: Thermodynamics wing with heat transfer modes, specific heat capacity, altitude adjustments, oven calibration models
- [ ] **COOK-03**: Nutrition wing with macronutrient roles, micronutrient bioavailability, preparation-nutrition relationships
- [ ] **COOK-04**: Technique wing with wet/dry/combination heat methods and knife skills hierarchy
- [ ] **COOK-05**: Baking Science wing with baker's ratios, gluten development, yeast biology, sugar chemistry
- [ ] **COOK-06**: Food Safety wing with temperature danger zone, cross-contamination prevention, safe storage times, allergen management
- [ ] **COOK-07**: Home Economics wing with meal planning, budget management, pantry management, preservation techniques
- [ ] **COOK-08**: Cooking calibration models for temperature, timing, seasoning, and texture feedback

### Safety

- [ ] **SAFE-01**: Safety Warden enforces absolute food safety boundaries — poultry ≥165°F, ground meat ≥160°F, whole cuts ≥145°F
- [ ] **SAFE-02**: Allergen warnings are non-negotiable — ingredient substitution always flags allergen implications
- [ ] **SAFE-03**: Safety Warden supports three modes: annotate (flag), gate (require acknowledgment), redirect (substitute safe alternative)
- [ ] **SAFE-04**: Temperature danger zone (40-140°F) time tracking with warnings at 2+ hours

### Integration

- [ ] **INTG-01**: Rosetta Core connects to skill-creator observation pipeline (exploring code triggers pattern detection)
- [ ] **INTG-02**: Token budget adapter ensures progressive disclosure respects 2-5% ceiling per panel load
- [ ] **INTG-03**: Chipset adapter maps Rosetta panels to chipset specialist agents
- [ ] **INTG-04**: Math↔Cooking cross-department references navigate correctly in both directions

### Testing

- [ ] **TEST-01**: 85%+ test coverage across all new code
- [ ] **TEST-02**: 14 safety-critical tests pass with zero tolerance (SC-01 through SC-14)
- [ ] **TEST-03**: Panel correctness tests verify mathematical accuracy across all panels
- [ ] **TEST-04**: Integration tests verify cross-component interfaces
- [ ] **TEST-05**: End-to-end test: user asks "why are my cookies flat?" → correct diagnosis

## Future Requirements

### Dependency Health (v1.49.9+)

- **DEPH-01**: Automated package auditing for maintenance status and security vulnerabilities
- **DEPH-02**: Staleness detection with alternative discovery
- **DEPH-03**: Progressive code internalization of stable external algorithms
- **DEPH-04**: Dependency health dashboard with risk scoring

### Additional Panels (v2.0)

- **VPAN-01**: VHDL hardware description panel
- **VPAN-02**: COBOL business logic panel
- **VPAN-03**: Structured representation panel (UML/SGML/XML/HTML)
- **VPAN-04**: Full Unison distributed computing integration

### Additional Departments (v2.0)

- **DEPT-01**: Computer Science Department (Languages, Algorithms, Systems, Architecture wings)
- **DEPT-02**: Physical Sciences Department (Physics, Chemistry, Electronics wings)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Multi-modal input (image recognition) | Future capability — requires vision pipeline |
| Community recipe contribution pipeline | Social feature — separate milestone |
| CKAN data cataloging integration | Infrastructure dependency — not ready |
| v1.50.x features | Separate branch, future release cycle |
| Full Unison distributed computing | v2.0 — initial panel covers fundamentals only |
| COBOL panel | Low priority heritage — v2.0 |
| Medical/dietary health claims | Liability concern — stay within peer-reviewed evidence |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CORE-05 | Phase 1: Foundation | Pending |
| CORE-01 | Phase 2: Rosetta Core Engine | Pending |
| CORE-02 | Phase 2: Rosetta Core Engine | Pending |
| CORE-03 | Phase 2: Rosetta Core Engine | Pending |
| CORE-04 | Phase 2: Rosetta Core Engine | Pending |
| CAL-01 | Phase 3: Calibration Engine | Pending |
| CAL-02 | Phase 3: Calibration Engine | Pending |
| CAL-03 | Phase 3: Calibration Engine | Pending |
| CAL-04 | Phase 3: Calibration Engine | Pending |
| CAL-05 | Phase 3: Calibration Engine | Pending |
| CAL-06 | Phase 3: Calibration Engine | Pending |
| COLL-01 | Phase 4: College Structure | Pending |
| COLL-02 | Phase 4: College Structure | Pending |
| COLL-03 | Phase 4: College Structure | Pending |
| COLL-04 | Phase 4: College Structure | Pending |
| COLL-05 | Phase 4: College Structure | Pending |
| PANEL-01 | Phase 5: Systems Panels and Mathematics Department | Pending |
| PANEL-02 | Phase 5: Systems Panels and Mathematics Department | Pending |
| PANEL-03 | Phase 5: Systems Panels and Mathematics Department | Pending |
| MATH-01 | Phase 5: Systems Panels and Mathematics Department | Pending |
| MATH-02 | Phase 5: Systems Panels and Mathematics Department | Pending |
| MATH-03 | Phase 5: Systems Panels and Mathematics Department | Pending |
| PANEL-04 | Phase 6: Heritage Panels | Pending |
| PANEL-05 | Phase 6: Heritage Panels | Pending |
| PANEL-06 | Phase 6: Heritage Panels | Pending |
| PANEL-07 | Phase 6: Heritage Panels | Pending |
| PANEL-08 | Phase 6: Heritage Panels | Pending |
| PANEL-09 | Phase 6: Heritage Panels | Pending |
| COOK-01 | Phase 7: Cooking Department | Pending |
| COOK-02 | Phase 7: Cooking Department | Pending |
| COOK-03 | Phase 7: Cooking Department | Pending |
| COOK-04 | Phase 7: Cooking Department | Pending |
| COOK-05 | Phase 7: Cooking Department | Pending |
| COOK-06 | Phase 7: Cooking Department | Pending |
| COOK-07 | Phase 7: Cooking Department | Pending |
| COOK-08 | Phase 7: Cooking Department | Pending |
| SAFE-01 | Phase 8: Safety Warden and Cross-References | Pending |
| SAFE-02 | Phase 8: Safety Warden and Cross-References | Pending |
| SAFE-03 | Phase 8: Safety Warden and Cross-References | Pending |
| SAFE-04 | Phase 8: Safety Warden and Cross-References | Pending |
| INTG-04 | Phase 8: Safety Warden and Cross-References | Pending |
| INTG-01 | Phase 9: Integration Bridge | Pending |
| INTG-02 | Phase 9: Integration Bridge | Pending |
| INTG-03 | Phase 9: Integration Bridge | Pending |
| TEST-01 | Phase 10: Test Suite and Verification | Pending |
| TEST-02 | Phase 10: Test Suite and Verification | Pending |
| TEST-03 | Phase 10: Test Suite and Verification | Pending |
| TEST-04 | Phase 10: Test Suite and Verification | Pending |
| TEST-05 | Phase 10: Test Suite and Verification | Pending |

**Coverage:**
- v1.49.8 requirements: 49 total (5 CORE + 9 PANEL + 5 COLL + 3 MATH + 6 CAL + 8 COOK + 4 SAFE + 4 INTG + 5 TEST)
- Mapped to phases: 49
- Unmapped: 0

---
*Requirements defined: 2026-03-01*
*Last updated: 2026-03-01 after roadmap creation — all 49 requirements mapped to phases 1-10*
