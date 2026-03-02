---
phase: 22-foundational-subject-migration
plan: "04"
subsystem: college-knowledge-layer
tags: [gap-closure, concepts, barrel-exports, specialized-departments]
dependency_graph:
  requires: ["22-03"]
  provides: ["specialized-department-wings-complete", "migr-02-satisfied"]
  affects: ["22-VERIFICATION.md"]
tech_stack:
  added: []
  patterns:
    - "RosettaConcept typed objects with domain-prefix IDs"
    - "Wing barrel export index.ts re-exporting all concepts via .js extensions"
    - "complexPlanePosition: concrete topics real 0.7-0.9, abstract topics imaginary 0.6-0.9"
    - "Cross-department relationships: pe->mb, theology->mb, astronomy->phys, music->math/phys, home-economics->nutr/culinary-arts"
key_files:
  created:
    - ".college/departments/art/concepts/art-in-context/art-patronage-economics.ts"
    - ".college/departments/art/concepts/creative-process/art-creative-block.ts"
    - ".college/departments/art/concepts/materials-making/art-sculpture-basics.ts"
    - ".college/departments/philosophy/concepts/aesthetics/art-and-beauty.ts"
    - ".college/departments/philosophy/concepts/aesthetics/sublime-experience.ts"
    - ".college/departments/philosophy/concepts/epistemology/knowledge-justification.ts"
    - ".college/departments/philosophy/concepts/epistemology/empiricism-rationalism.ts"
    - ".college/departments/philosophy/concepts/ethics/virtue-ethics.ts"
    - ".college/departments/philosophy/concepts/logic-reasoning/deductive-reasoning.ts"
    - ".college/departments/philosophy/concepts/wonder-questioning/thought-experiments.ts"
    - ".college/departments/nature-studies/concepts/animals-birds/insect-identification.ts"
    - ".college/departments/nature-studies/concepts/citizen-science/data-collection.ts"
    - ".college/departments/nature-studies/concepts/citizen-science/community-monitoring.ts"
    - ".college/departments/nature-studies/concepts/ecology-habitats/food-webs.ts"
    - ".college/departments/nature-studies/concepts/outdoor-observation/weather-patterns.ts"
    - ".college/departments/nature-studies/concepts/plants-fungi/plant-propagation.ts"
    - ".college/departments/physical-education/concepts/fitness-body-science/muscular-strength.ts"
    - ".college/departments/physical-education/concepts/movement-foundations/balance-coordination.ts"
    - ".college/departments/physical-education/concepts/movement-foundations/locomotor-skills.ts"
    - ".college/departments/physical-education/concepts/outdoor-adventure/hiking-navigation.ts"
    - ".college/departments/physical-education/concepts/outdoor-adventure/camping-skills.ts"
    - ".college/departments/physical-education/concepts/sports-games/team-sports.ts"
    - ".college/departments/physical-education/concepts/sports-games/individual-sports.ts"
    - ".college/departments/physical-education/concepts/wellness-lifetime-fitness/nutrition-for-fitness.ts"
    - ".college/departments/home-economics/concepts/childcare-community/child-development.ts"
    - ".college/departments/home-economics/concepts/childcare-community/community-resources.ts"
    - ".college/departments/home-economics/concepts/financial-literacy/saving-investing.ts"
    - ".college/departments/home-economics/concepts/financial-literacy/consumer-awareness.ts"
    - ".college/departments/home-economics/concepts/home-management/cleaning-organization.ts"
    - ".college/departments/home-economics/concepts/home-management/home-maintenance.ts"
    - ".college/departments/home-economics/concepts/kitchen-cooking/food-preservation.ts"
    - ".college/departments/home-economics/concepts/textiles-clothing/sewing-basics.ts"
    - ".college/departments/home-economics/concepts/textiles-clothing/fabric-selection.ts"
    - ".college/departments/theology/concepts/ethics-justice/social-justice.ts"
    - ".college/departments/theology/concepts/ethics-justice/moral-reasoning.ts"
    - ".college/departments/theology/concepts/sacred-practices/meditation-contemplation.ts"
    - ".college/departments/theology/concepts/sacred-practices/pilgrimage.ts"
    - ".college/departments/theology/concepts/stories-traditions/creation-narratives.ts"
    - ".college/departments/theology/concepts/stories-traditions/prophetic-tradition.ts"
    - ".college/departments/theology/concepts/ultimate-questions/meaning-purpose.ts"
    - ".college/departments/theology/concepts/ultimate-questions/afterlife-beliefs.ts"
    - ".college/departments/theology/concepts/world-religions/eastern-religions.ts"
    - ".college/departments/theology/concepts/world-religions/abrahamic-faiths.ts"
    - ".college/departments/astronomy/concepts/cosmology/big-bang.ts"
    - ".college/departments/astronomy/concepts/cosmology/dark-matter-energy.ts"
    - ".college/departments/astronomy/concepts/earth-moon-sun/eclipses.ts"
    - ".college/departments/astronomy/concepts/observing-sky/telescope-basics.ts"
    - ".college/departments/astronomy/concepts/observing-sky/celestial-coordinates.ts"
    - ".college/departments/astronomy/concepts/solar-system/planetary-geology.ts"
    - ".college/departments/astronomy/concepts/solar-system/small-bodies.ts"
    - ".college/departments/astronomy/concepts/stellar-physics/hr-diagram.ts"
    - ".college/departments/learning/concepts/learning-brain/neuroplasticity.ts"
    - ".college/departments/learning/concepts/learning-brain/sleep-learning.ts"
    - ".college/departments/learning/concepts/learning-environments/collaborative-learning.ts"
    - ".college/departments/learning/concepts/learning-environments/digital-learning-tools.ts"
    - ".college/departments/learning/concepts/metacognition/self-assessment.ts"
    - ".college/departments/learning/concepts/metacognition/learning-strategies-awareness.ts"
    - ".college/departments/learning/concepts/mindset-motivation/intrinsic-motivation.ts"
    - ".college/departments/learning/concepts/mindset-motivation/goal-setting.ts"
    - ".college/departments/learning/concepts/study-strategies/active-recall.ts"
    - ".college/departments/music/concepts/harmony-structure/chord-progressions.ts"
    - ".college/departments/music/concepts/harmony-structure/song-form.ts"
    - ".college/departments/music/concepts/instruments-ensemble/instrument-families.ts"
    - ".college/departments/music/concepts/instruments-ensemble/ensemble-playing.ts"
    - ".college/departments/music/concepts/melody-voice/melodic-contour.ts"
    - ".college/departments/music/concepts/melody-voice/vocal-technique.ts"
    - ".college/departments/music/concepts/music-history-culture/musical-periods.ts"
    - ".college/departments/music/concepts/music-history-culture/world-music.ts"
    - ".college/departments/music/concepts/rhythm-movement/syncopation.ts"
    - ".college/departments/trades/concepts/electrical-basics/circuit-types.ts"
    - ".college/departments/trades/concepts/electrical-basics/electrical-codes.ts"
    - ".college/departments/trades/concepts/plumbing-hvac/pipe-fitting.ts"
    - ".college/departments/trades/concepts/plumbing-hvac/hvac-basics.ts"
    - ".college/departments/trades/concepts/project-management/estimating-bidding.ts"
    - ".college/departments/trades/concepts/project-management/client-communication.ts"
    - ".college/departments/trades/concepts/tools-safety/power-tools.ts"
    - ".college/departments/trades/concepts/woodworking/joinery.ts"
    - ".college/departments/trades/concepts/woodworking/finishing.ts"
    - ".college/departments/**/index.ts (50 barrel export files)"
  modified: []
decisions:
  - "Used minimum exactly 3 concepts per wing (matching the plan specification) rather than pushing to 5 — gap closure, not overreach"
  - "Sorted barrel exports alphabetically by filename to maintain consistent ordering"
  - "Preserved all existing cross-department relationships from 22-03 in new concept files"
  - "Added new cross-references: theology->mb (meditation-contemplation), pe->nature-studies (hiking-navigation), astronomy->physics (dark-matter-energy)"
metrics:
  duration: "14 min"
  completed: "2026-03-02"
  tasks_completed: 2
  files_created: 128
---

# Phase 22 Plan 04: Gap Closure Summary

**One-liner:** 78 typed RosettaConcept files and 50 index.ts barrel exports bringing all 50 specialized department wings to structural parity with core academic departments.

## What Was Built

This gap closure plan addressed two verification failures from 22-VERIFICATION.md that prevented MIGR-02 from being fully satisfied:

1. **Gap 1: Insufficient concept files** — Plan 22-03 delivered 1-2 concept files per wing for all 10 specialized departments (30 of 50 wings had exactly 1 concept). This plan added 78 new typed RosettaConcept files to bring every wing to exactly 3 concepts, for a total of 150 concept files across 50 wings.

2. **Gap 2: Missing barrel exports** — Plans 22-01 and 22-02 created index.ts barrel exports for all 125 wings in their departments, but Plan 22-03 omitted this step entirely. This plan created 50 index.ts files, one for every wing in the 10 specialized departments.

## Results

### Concept File Coverage

| Department | Wings | Before | Added | Total |
|-----------|-------|--------|-------|-------|
| art | 5 | 12 | 3 | 15 |
| philosophy | 5 | 8 | 7 | 15 |
| nature-studies | 5 | 9 | 6 | 15 |
| physical-education | 5 | 7 | 8 | 15 |
| home-economics | 5 | 6 | 9 | 15 |
| theology | 5 | 5 | 10 | 15 |
| astronomy | 5 | 7 | 8 | 15 |
| learning | 5 | 6 | 9 | 15 |
| music | 5 | 6 | 9 | 15 |
| trades | 5 | 6 | 9 | 15 |
| **Total** | **50** | **72** | **78** | **150** |

### Verification Results

```
Concept count: 150 (72 existing + 78 new) — PASS
Index.ts count: 50 (all 50 specialized wings) — PASS
Wings with < 3 concepts: 0 — PASS
Art/Theology/Trades integration tests: 18/18 — PASS
Discovery smoke test: 12/12 — PASS
```

## Concept File Quality

All 78 new concept files:
- Follow the exact pattern from `.college/departments/physics/concepts/motion-forces/motion-kinematics.ts`
- Use the domain-prefix convention established in decisions (art-, philo-, nature-, pe-, domestic-, theo-, astro-, learn-, music-, trade-)
- Include at least 1 relationship (dependency, analogy, or cross-reference) to an existing concept in the same department
- Set complexPlanePosition values per the guidance: concrete hands-on topics at real 0.7-0.9, abstract theoretical topics at imaginary 0.6-0.9
- Have substantive 2-4 sentence descriptions with specific, accurate content

## Barrel Export Quality

All 50 index.ts files:
- Follow the pattern: `export { camelCaseName } from './kebab-case-name.js';`
- Use `.js` extension in import paths (ESM module resolution)
- Export ALL concepts in each wing (both existing and newly added)
- Are sorted alphabetically by filename

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

| Check | Result |
|-------|--------|
| `theology/world-religions/index.ts` exists | FOUND |
| `art/art-in-context/index.ts` exists | FOUND |
| `trades/woodworking/index.ts` exists | FOUND |
| `theology/ethics-justice/` directory exists | FOUND |
| `learning/metacognition/` directory exists | FOUND |
| Commit 533bf37a (Task 1) exists | FOUND |
| Commit ea9d12dd (Task 2) exists | FOUND |
| Total index.ts barrel exports | 50 |
| Total concept files | 150 |
