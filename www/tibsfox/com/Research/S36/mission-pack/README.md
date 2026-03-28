# Seattle 360 — Continuous Artist Release Engine
## GSD Mission Package

**Date:** 2026-03-28
**Version:** 1.0.0
**Status:** Ready for GSD Orchestrator
**Pipeline:** Full (Vision → Research → Mission)
**Input:** `seattle_360_geo.csv` — 360 artists, 0°–359° of Seattle's music universe

---

## Contents

| File | Purpose |
|------|---------|
| `01-vision-doc.md` | North star: what and why — the 360° Seattle music education engine |
| `02-research-reference.md` | Seattle music history, music theory pedagogy, College of Knowledge mapping |
| `03-milestone-spec.md` | Mission objective, deliverables, crew, constraints |
| `04-wave-execution-plan.md` | Wave structure, parallel tracks, token budget |
| `05-test-plan.md` | All tests, verification matrix, safety-critical gates |
| `components/00-shared-types.md` | Wave 0: ArtistProfile, MissionPack, RetrospectiveRecord schemas |
| `components/01-csv-intake-engine.md` | Parse CSV → 360 ArtistProfile objects with genre/theory metadata |
| `components/02-music-theory-mapper.md` | Map each artist to College of Knowledge music theory curriculum nodes |
| `components/03-fleet-research-generator.md` | Generate full Fleet research mission PDF per artist (Opus-driven) |
| `components/04-college-knowledge-linker.md` | Deep link each release to `.college/` departments and theory modules |
| `components/05-release-pipeline.md` | Sequential release coordinator — one artist at a time, state-managed |
| `components/06-retrospective-engine.md` | Extract lessons learned after each release, update KnowledgeState |
| `components/07-carry-forward-controller.md` | Seed next mission from retrospective learnings |
| `components/08-safety-warden.md` | Attribution, accuracy, cultural sensitivity gates (BLOCK-level) |

---

## How to Use

### Prerequisites
```bash
# Ensure CSV is present
cp seattle_360_geo.csv .gsd/inputs/

# Ensure skill-creator is on dev branch
git -C ~/gsd-skill-creator checkout dev
```

### Launch
```bash
# Hand the vision doc to Claude Code as project charter
claude --new-task "$(cat 01-vision-doc.md)

Begin Wave 0. Read components/00-shared-types.md and components/01-csv-intake-engine.md.
Input: .gsd/inputs/seattle_360_geo.csv
Output root: .gsd/releases/seattle-360/"
```

### Continuous Loop Execution
Once Wave 0 completes, the release engine handles the full 360-artist cycle autonomously:
```
Wave 0 → Artist #0 (Quincy Jones) → Retrospective → Artist #1 (Bill Frisell) → ...
```

Each artist produces:
- `releases/seattle-360/N-[artist-slug]/research-mission.pdf`
- `releases/seattle-360/N-[artist-slug]/index.html`
- `releases/seattle-360/N-[artist-slug]/knowledge-nodes.json`
- `releases/seattle-360/N-[artist-slug]/retrospective.md`
- `releases/seattle-360/knowledge-state.json` (running accumulation)

---

## Execution Summary

| Metric | Value |
|--------|-------|
| Total artists | 360 |
| Total components | 9 (including Safety Warden) |
| Parallel tracks | 2 (Wave 1: theory mapper + college linker) |
| Sequential depth | 4 waves per artist cycle |
| Activation profile | Fleet (Full crew, 16 roles) |
| Model split | ~30% Opus / ~60% Sonnet / ~10% Haiku |
| Estimated tokens per artist | ~45K |
| Estimated total token budget | ~16.2M (360 × 45K) |
| Estimated context windows | ~720 (2 per artist) |
| Safety-critical tests | 22 (mandatory-pass per release) |
| College departments linked | 7+ per release |

---

## Ecosystem Connections

| Document | Relationship |
|----------|-------------|
| `gsd-skill-creator-analysis.md` | Execution engine for all fleet missions |
| `gsd-bbs-educational-pack-vision.md` | Output format compatible with BBS pack delivery |
| `unit-circle-skill-creator-synthesis.md` | Unit circle metaphor maps to the 360° CSV structure |
| `gsd-chipset-architecture-vision.md` | Chipset YAML patterns used in each fleet mission |
| `.college/` (Rosetta Core) | Primary destination for all generated curriculum nodes |
| *The Space Between* | Mathematical spine — frequency ratios, rhythm theory seeded from textbook |

---

## The 360° Metaphor

The CSV is not accidental — 360 artists mapped to 0°–359° of a unit circle, spanning
jazz at 0° (Quincy Jones) through peak intensity at 359° (Unwound). Energy (1–10) maps
to radius. Genre maps to quadrant. This is the Amiga Principle made musical: the entire
Seattle sound, traversed as a single continuous rotation.

Each release is one degree. The full run completes the circle.
