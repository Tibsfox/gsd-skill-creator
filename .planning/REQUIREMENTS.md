# Requirements: gsd-skill-creator

**Defined:** 2026-03-01
**Core Value:** Skills are discovered from real patterns and proved against mathematical foundations — one concept, many expressions

## v1.49.10 Requirements

Requirements for College Expansion milestone. Each maps to roadmap phases.

### Subject Migration

- [x] **MIGR-01**: Each of the 35 foundational knowledge packs is converted to a college department directory under `.college/departments/`
- [x] **MIGR-02**: Each pack's 5 YAML modules become 5 wings with typed RosettaConcept files
- [x] **MIGR-03**: Pack activities and assessments are preserved as try-sessions and calibration models per department
- [x] **MIGR-04**: Pack metadata (.skillmeta) is mapped to DEPARTMENT.md fields (description, domain prefix, wing structure)
- [x] **MIGR-05**: Concept IDs follow domain-prefix convention (phys-, chem-, art-, etc.) consistent with existing departments
- [x] **MIGR-06**: CollegeLoader auto-discovers all 41 departments from the filesystem without framework code changes

### Specialized Integration

- [x] **SPEC-01**: Electronics Pack (15 modules) is grouped into 5 tier-based wings with MNA lab simulations preserved
- [x] **SPEC-02**: Minecraft Knowledge World is mapped as spatial-computing department with build-based try-sessions
- [x] **SPEC-03**: OpenStack/NASA SE is mapped as cloud-systems department with runbook-based try-sessions
- [x] **SPEC-04**: Specialized pack features (MNA simulator, spatial builds, runbooks) are exposed through department-specific extensions
- [x] **SPEC-05**: Chipset configurations from specialized packs are migrated to department chipset/ directories

### Dynamic Mapping

- [x] **MAP-01**: Mapping schema (JSON) defines virtual departments by composing flat subjects
- [x] **MAP-02**: Default mapping ships with at least 6 virtual department groupings (Sciences, Computing, Humanities, Arts, etc.)
- [x] **MAP-03**: Educational track definitions support prerequisite ordering and recommended sequences through multiple subjects
- [x] **MAP-04**: User-created custom mappings are stored in `.college/mappings/user/` and loaded by the explorer
- [x] **MAP-05**: Mapping changes take effect without restart (hot-reload)
- [x] **MAP-06**: Adding a new subject requires only a new directory — no code changes, no mapping updates required

### Cross-References

- [ ] **XREF-01**: All 48 edges from dependency-graph.yaml are imported as Rosetta cross-references
- [ ] **XREF-02**: New cross-references between foundational packs and existing departments are validated (nutrition↔culinary-arts, physical-education↔mind-body, math↔mathematics)
- [ ] **XREF-03**: Cross-reference resolver handles 41-department scale without performance degradation
- [ ] **XREF-04**: Complex Plane positioning is assigned for all new concepts (real=concreteness, imaginary=complexity)
- [ ] **XREF-05**: Dependency chain validation enforces max depth 4 with no circular references

### Safety

- [ ] **SAFE-01**: Chemistry department has SafetyBoundary definitions for lab safety procedures
- [ ] **SAFE-02**: Electronics department has SafetyBoundary definitions for electrical safety
- [ ] **SAFE-03**: Physical-education department has SafetyBoundary definitions for injury prevention
- [ ] **SAFE-04**: Nutrition department has SafetyBoundary definitions for allergen management
- [ ] **SAFE-05**: Safety boundaries integrate with the existing 3-mode Safety Warden (annotate/gate/redirect)

### Test Suite

- [ ] **TEST-01**: Integration tests verify all 41 departments are discovered, parsed, and loaded by CollegeLoader
- [ ] **TEST-02**: Cross-reference integrity tests confirm all relationship targets resolve across departments
- [ ] **TEST-03**: Mapping validation tests verify all referenced subjects exist with no orphans
- [ ] **TEST-04**: Safety-critical tests verify SafetyBoundary definitions for chemistry, electronics, PE, nutrition
- [ ] **TEST-05**: Token budget verification confirms summary tier under 3K tokens per department, active tier under 12K per wing
- [ ] **TEST-06**: Calibration model registration tests pass for all departments with domain-specific models
- [ ] **TEST-07**: CollegeLoader performance test confirms 41 departments discovered in under 100ms

## Future Requirements

### Extended Mapping Features

- **MAP-F01**: Project-context mappings that auto-suggest relevant subjects based on project type
- **MAP-F02**: Mapping CRUD operations (create, read, update, delete) through college explorer UI
- **MAP-F03**: Mapping import/export for sharing between projects

## Out of Scope

| Feature | Reason |
|---------|--------|
| Hierarchical department structures | Flat atoms + dynamic mappings is the chosen architecture |
| New Rosetta Core panels beyond existing 9 | This milestone is content expansion, not engine expansion |
| Interactive simulations beyond MNA | Preserve existing MNA, don't build new simulators |
| New calibration engine features | Use existing engine, register new domain models only |
| Content authoring tools | Departments authored by code, not by users |
| COBOL panel | v2.0 scope |
| Video/multimedia content | Text builds proprioception — deliberate philosophical choice |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| MIGR-01 | Phase 22 | Complete |
| MIGR-02 | Phase 22 | Complete |
| MIGR-03 | Phase 22 | Complete |
| MIGR-04 | Phase 22 | Complete |
| MIGR-05 | Phase 22 | Complete |
| MIGR-06 | Phase 22 | Complete |
| SPEC-01 | Phase 23 | Complete |
| SPEC-02 | Phase 23 | Complete |
| SPEC-03 | Phase 23 | Complete |
| SPEC-04 | Phase 23 | Complete |
| SPEC-05 | Phase 23 | Complete |
| MAP-01 | Phase 24 | Complete |
| MAP-02 | Phase 24 | Complete |
| MAP-03 | Phase 24 | Complete |
| MAP-04 | Phase 24 | Complete |
| MAP-05 | Phase 24 | Complete |
| MAP-06 | Phase 24 | Complete |
| XREF-01 | Phase 25 | Pending |
| XREF-02 | Phase 25 | Pending |
| XREF-03 | Phase 25 | Pending |
| XREF-04 | Phase 25 | Pending |
| XREF-05 | Phase 25 | Pending |
| SAFE-01 | Phase 26 | Pending |
| SAFE-02 | Phase 26 | Pending |
| SAFE-03 | Phase 26 | Pending |
| SAFE-04 | Phase 26 | Pending |
| SAFE-05 | Phase 26 | Pending |
| TEST-01 | Phase 27 | Pending |
| TEST-02 | Phase 27 | Pending |
| TEST-03 | Phase 27 | Pending |
| TEST-04 | Phase 27 | Pending |
| TEST-05 | Phase 27 | Pending |
| TEST-06 | Phase 27 | Pending |
| TEST-07 | Phase 27 | Pending |

**Coverage:**
- v1.49.10 requirements: 34 total
- Mapped to phases: 34
- Unmapped: 0

---
*Requirements defined: 2026-03-01*
*Last updated: 2026-03-01 — traceability complete after roadmap creation*
