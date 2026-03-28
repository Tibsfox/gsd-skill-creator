# PNW 360 Species — Milestone Specification (Part B)

**Date:** 2026-03-28  
**Vision Document:** `PART-B/01-vision-doc-partB.md`  
**Research Reference:** `PART-B/02-research-reference-partB.md`  
**Estimated Execution:** ~720 context windows across ~180 sessions  
**Parallel to:** `seattle-360-mission/03-milestone-spec.md` (Part A)

---

## Mission Objective

Process all 360 entries in `pnw_360_species.csv` sequentially, producing a complete Fleet
research mission artifact set per species — full LaTeX PDF, .tex source, index.html,
acoustic-theory-nodes.json, and retrospective.md — with OCAP®-compliant attribution,
bioacoustic theory mapping to music theory parallels, College of Knowledge deep links
(including two new departments), and retrospective-driven knowledge accumulation across
all 360 releases. "Done" = `releases/pnw-360/359-puget-sound-silence/` published, SRKW
conservation context verified, `bioacoustic-genealogy.json` complete.

---

## Architecture Overview

```
INPUT: pnw_360_species.csv (360 rows)
           │
    ┌──────┴──────────────────────────────────────┐
    │  WAVE 0: FOUNDATION                          │
    │  SpeciesProfile[N] + KnowledgeState[N]       │
    └──────┬──────────────────────────────────────┘
           │
    ┌──────┴──────────┐  ┌──────────────────────┐
    │ WAVE 1A:        │  │ WAVE 1B:             │
    │ ACOUSTIC MAPPER │  │ COLLEGE LINKER       │
    │ EAGLE/Sonnet    │  │ ORCA/Sonnet          │
    │ AcousticNodes   │  │ CollegeLinkList      │
    └──────┬──────────┘  └────────────┬─────────┘
           └─────────────┬────────────┘
                         ▼
           ┌─────────────────────────────┐
           │ WAVE 2: FLEET RESEARCH GEN  │
           │ HAWK/Opus                   │
           │ PDF + .tex + index.html     │
           └──────────────┬──────────────┘
                          ▼
           ┌─────────────────────────────┐
           │ WAVE 3a: SAFETY WARDEN      │
           │ WARDEN/Opus                 │
           │ OCAP® + ESA + location gate │
           └──────────────┬──────────────┘
                     PASS │ BLOCK→CAPCOM
                          ▼
           ┌──────────────────────────────┐
           │ WAVE 3b–3d: RELEASE/RETRO/   │
           │ CARRY-FORWARD                │
           └──────────────┬───────────────┘
                          ▼
                    Species [N+1]
```

---

## Component Breakdown

| # | Component | Wave | Model | Tokens/Species | Agent | Depends On |
|---|-----------|------|-------|---------------|-------|------------|
| B0 | Shared Types | 0 | Haiku | ~4K (once) | — | None |
| B1 | Species Intake | 0 | Haiku | ~2K | SALMON | B0 |
| B2 | Acoustic Theory Mapper | 1A | Sonnet | ~9K | EAGLE | B1 |
| B3 | Fleet Research Generator | 2 | Opus | ~22K | HAWK | B2, B4 |
| B4 | College Knowledge Linker | 1B | Sonnet | ~7K | ORCA | B1 |
| B5 | Release Pipeline | 3b | Sonnet | ~3K | HERON | B3, B8 |
| B6 | Retrospective Engine | 3c | Opus | ~9K | OWL | B5 |
| B7 | Carry-Forward Controller | 3d | Sonnet | ~4K | CEDAR | B6 |
| B8 | Safety Warden | 3a | Opus | ~8K | WARDEN | B3 |

**Per-species token estimate:** ~62K  
**Total estimated token budget:** ~22.3M (360 × 62K)  
**Opus fraction:** ~39K/62K ≈ 63% (justified — bioacoustic synthesis is judgment-heavy)

---

## Activation Profile

**Profile:** Fleet (10 roles — same structure as Part A with domain-adapted naming)

| Role | Agent | Wave | Responsibility |
|------|-------|------|----------------|
| FLIGHT | RAVEN | All | Orchestration; go/no-go; loop control |
| PLAN | SALMON | 0 | Species intake; SpeciesProfile generation |
| INTEL-A | EAGLE | 1A | Acoustic theory mapping (Sonnet) |
| INTEL-B | ORCA | 1B | College Knowledge linking (Sonnet) |
| EXEC | HAWK | 2 | Fleet research synthesis (Opus) |
| SAFETY | WARDEN | 3a | OCAP®, ESA, location, sensitivity (Opus) |
| RELEASE | HERON | 3b | Sequential atomic publication (Sonnet) |
| RETRO | OWL | 3c | Lessons learned (Opus) |
| STATE | CEDAR | 3d | KnowledgeState; bioacoustic genealogy (Sonnet) |
| CAPCOM | Human | BLOCK | Reviews BLOCK findings; authorizes resume |

---

## Deliverables

| # | Deliverable | Acceptance Criteria | Component |
|---|-------------|--------------------|-----------| 
| 1 | `SpeciesProfile[360]` | All 360 parsed; SPECIES vs SOUNDSCAPE_COMPOSITION typed | B01 |
| 2 | `AcousticTheoryNodeList` per species | ≥3 acoustic nodes; music theory parallel per node | B02 |
| 3 | Fleet research PDF per species | XeLaTeX compiles; 3 stages; SRKW conservation context present | B03 |
| 4 | `CollegeLinkList` per species | ≥3 links; includes bioacoustics dept; math bridge present | B04 |
| 5 | Release artifact set (360×) | All in `releases/pnw-360/NNN-[slug]/` | B05 |
| 6 | `retrospective.md` per species | ≥1 IMMEDIATE carry item; CONFIRMED | B06 |
| 7 | `knowledge-state.json` (final) | Bioacoustic genealogy complete; 360 entries | B07 |
| 8 | Safety audit log (360×) | SRKW context verified; OCAP® compliance confirmed | B08 |

---

## Constraints

- **SRKW mandatory context:** Every SRKW release (degrees 270–277, 311, 340, 348, 357)
  MUST include: current population estimate, ESA listing status, primary threats, NOAA
  recovery plan reference. Non-compliance = BLOCK.
- **No precise sensitive locations:** Species with documented sensitivity to disturbance
  (nesting Bald Eagles, SRKW foraging areas, salmon spawning beds) must not publish
  precise coordinates. Region/watershed names only.
- **SOUNDSCAPE_COMPOSITION entries:** Degrees 308–359 "equivalence" entries are
  explicitly framed as conceptual soundscape compositions — not single-species records.
  They receive compositional analysis framing in Stage 1, ecological accuracy framing
  in Stage 2, and acoustic art / College synthesis framing in Stage 3.
- **Barred Owl handling:** The Barred Owl (degree=137) is an invasive species actively
  managed by USFWS (lethal removal authorized under 2024 pilot program). Release must
  accurately reflect this complex conservation reality.
- **Safety Warden model:** Opus only. The ecological + cultural complexity of this
  dataset requires Opus-level judgment; Sonnet cannot be substituted.
