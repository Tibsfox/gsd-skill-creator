# Retrospective System — Component Specification

**Milestone:** NASA Mission Series
**Wave:** 1 | **Track:** B
**Model Assignment:** Opus
**Estimated Tokens:** ~30K
**Dependencies:** Component #0 (Shared Types)
**Produces:** `skills/nasa/retrospective/SKILL.md`, 8-pass template, lessons-forward schema, template delta tracker

---

## Objective

Build the retrospective system that runs Part G's 8-pass refinement after each mission and manages the lessons-forward chain across releases. The system classifies findings, tracks template improvements, identifies TSPB mathematical content, and links lessons from release N to release N+1's pre-flight check. Done means: after any release, the retrospective produces classified lessons, template deltas, and TSPB candidates that are automatically loaded by the next release.

## Context

Part G's 8-pass refinement template (from files_193_.zip / nasa_partg_template.tex) defines the systematic improvement loop:

1. **Retrospective Harvest** — Read all RETRO outputs from Parts A-F; classify findings
2. **Fix and Test** — Implement Pass 1 findings; add tests; validate
3. **Cross-Part Integration** — Consistency across Parts A-F for this mission
4. **Integration Retrospective** — Lessons learned from Pass 3
5. **Template Hardening** — Strengthen templates based on Passes 1-4
6. **Refinement** — Prune, tighten, improve; remove redundancy
7. **TSPB Identification** — Identify mathematical content for The Space Between
8. **TSPB Expansion** — Draft new TSPB chapters from mission mathematics

The McNeese-Hoag Reference Standard applies: Tables, Formulas, Examples in every section. Dense but navigable. Every page earns its presence.

The retrospective system is the engine of iterative improvement. Without it, release N+1 is no better than release N. With it, quality compounds across the entire 73-release series.

Schema reference (from Component #0): Retrospective, RetroPass, Lesson, TemplateDelta, TSPBCandidate types.

## Technical Specification

### SKILL.md Core Logic

The retrospective skill executes 8 sequential passes, producing structured output at each:

**Pass 1 (Harvest):** Read all Part A-F outputs for the current mission. For each part, answer: What worked? What was awkward? What was missing? What was wrong? Classify each finding as `template-improvement`, `skill-improvement`, `agent-improvement`, `process-improvement`, `safety-finding`, `chipset-improvement`, or `team-topology-improvement`.

**Pass 2 (Fix):** For findings classified `template-improvement` or `process-improvement` with severity `critical` or `important`, draft the fix. Apply the fix to a copy of the relevant template. Run the modified template against the current mission's input to verify it produces better output.

**Pass 3 (Cross-Part):** Check consistency across Parts A-F: Do dates match across parts? Do crew names match? Are engineering values in Part D consistent with hardware descriptions in Part A? Are Part C educational exercises aligned with Part D mathematical content?

**Pass 4 (Integration Retro):** What did Pass 3 reveal about the template system? Are the part templates asking for the right things? Are there cross-part checks that should be automated?

**Pass 5 (Hardening):** Make templates more robust based on Passes 1-4. This is defensive: add validation steps, clarify ambiguous instructions, add examples where agents struggled.

**Pass 6 (Refinement):** Apply "more useful, not longer." Remove redundancy across all outputs. Tighten prose. Improve information density. Every line must earn its place.

**Pass 7 (TSPB Identification):** Scan Parts C, D, E for mathematical content that maps to The Space Between's eight-layer progression (Unit Circle, Pythagorean Theorem, Trigonometry, Vector Calculus, Set Theory, Category Theory, Information Systems Theory, L-Systems). Identify candidate topics with source part, math layer, and target TSPB chapter.

**Pass 8 (TSPB Expansion):** For candidates identified in Pass 7, draft TSPB content following the McNeese-Hoag standard: Tables, Formulas, Examples. Content uses real parameters from the mission. Deposit in `docs/TSPB/[chapter]/`.

### Lessons-Forward Chain

```
Release N retrospective produces:
  lessons: [
    { id: "v1.5-L001", category: "template-improvement", severity: "important",
      description: "Part D template missing thermal analysis section header",
      forwardLinked: true }
  ]

Release N+1 pre-flight check loads:
  lessonsToApply: [
    { sourceVersion: "1.5", lessonId: "v1.5-L001",
      description: "...", applicationNote: "Add thermal header to Part D template" }
  ]
```

### Behavioral Requirements

- All 8 passes execute in order; no pass may be skipped
- Lessons from critical/important findings are automatically forward-linked
- Minor findings are logged but not forward-linked (to prevent noise accumulation)
- Template deltas include before/after comparisons (reviewable by CAPCOM)
- TSPB candidates must map to a specific math layer (1-8) and target chapter
- The retrospective for v1.0 is abbreviated (Passes 1-3 and 7-8 only, since there are no prior templates to improve)

## Implementation Steps

1. Create `skills/nasa/retrospective/SKILL.md` with 8-pass logic
2. Create pass templates (structured prompts for each pass)
3. Implement lessons-forward schema and linking logic
4. Implement template delta tracker (before/after with diff)
5. Create TSPB candidate identification rubric (math layer → chapter mapping)
6. Test: run retrospective on synthetic mission output; verify all 8 passes produce structured findings

## Test Cases

| Test ID | Input | Expected Output | Pass Condition |
|---------|-------|-----------------|----------------|
| RT-01 | Complete Parts A-F output | 8 passes documented | All passes have findings or "no findings" |
| RT-02 | Pass 1 finds critical template issue | Lesson forward-linked | forwardLinked: true; severity: critical |
| RT-03 | Pass 3 finds date inconsistency | Flagged for correction | Cross-part consistency violation documented |
| RT-04 | Pass 7 finds orbital mechanics content | TSPB candidate created | mathLayer: 3 (Trigonometry); targetChapter specified |
| RT-05 | v1.0 retrospective | Abbreviated (Passes 1-3, 7-8) | Only specified passes present; no template deltas |
| RT-06 | Release N+1 pre-flight | Loads N lessons | lessonsToApply populated from prior retrospective |

## Verification Gate

- [ ] SKILL.md complete with all 8 pass definitions
- [ ] Lessons-forward chain operational (N retrospective → N+1 pre-flight)
- [ ] Template delta tracker produces reviewable before/after diffs
- [ ] TSPB candidates correctly mapped to math layers 1-8
- [ ] v1.0 abbreviated retrospective handled correctly

## Safety Boundaries

| Constraint | Boundary Type |
|-----------|---------------|
| Template changes must not weaken existing safety gates | ABSOLUTE |
| TSPB mathematical content must be verified against source derivations | GATE |
| Critical lessons must be forward-linked (not optional) | ABSOLUTE |
