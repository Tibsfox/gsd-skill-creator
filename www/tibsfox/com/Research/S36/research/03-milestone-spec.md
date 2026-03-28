# Seattle 360 — Milestone Specification

**Date:** 2026-03-28
**Vision Document:** `01-vision-doc.md`
**Research Reference:** `02-research-reference.md`
**Estimated Execution:** ~720 context windows across ~180 sessions (2 windows/artist, ~2 artists/session)

---

## Mission Objective

Build and execute a fully autonomous, continuous-release educational engine that processes
all 360 artists in `seattle_360_geo.csv` sequentially, producing a complete Fleet research
mission artifact set per artist — full LaTeX PDF, .tex source, index.html, theory nodes,
and College of Knowledge deep links — with retrospective-driven knowledge accumulation
across all 360 releases. "Done" looks like `releases/seattle-360/359-unwound/` existing
as a complete, Safety-Warden-passed release, with `theory-genealogy.json` tracing the
connected theoretical lineage from degree 0 (Quincy Jones) through degree 359 (Unwound).

---

## Architecture Overview

```
 INPUT: seattle_360_geo.csv (360 rows)
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│  WAVE 0: FOUNDATION (Sequential, <5 min per artist)             │
│  ┌───────────────────┐    ┌──────────────────────────────────┐  │
│  │  01: CSV Intake   │    │  KnowledgeState[N] (from N-1)    │  │
│  │  → ArtistProfile  │    │  → theory-genealogy, node-index  │  │
│  └─────────┬─────────┘    └──────────────┬───────────────────┘  │
└────────────┼────────────────────────────-┼─────────────────────┘
             │                              │
             ▼                              ▼
┌────────────────────────┐    ┌─────────────────────────────────┐
│  WAVE 1A: THEORY       │    │  WAVE 1B: COLLEGE LINKS         │
│  02: Music Theory      │    │  04: College Knowledge Linker   │
│  Mapper (Sonnet)       │    │  (Sonnet)                       │
│  → TheoryNodeList      │    │  → CollegeLinkList              │
└────────────┬───────────┘    └──────────────┬──────────────────┘
             └──────────┬────────────────────┘
                        ▼
         ┌──────────────────────────────────┐
         │  WAVE 2: FLEET RESEARCH GEN      │
         │  03: Research Generator (Opus)   │
         │  → PDF + .tex + index.html       │
         │  → knowledge-nodes.json          │
         └──────────────┬───────────────────┘
                        ▼
         ┌──────────────────────────────────┐
         │  WAVE 3: RELEASE + VERIFY + LOOP │
         │  05: Release Pipeline            │
         │  08: Safety Warden (BLOCK gate)  │
         │  06: Retrospective Engine (Opus) │
         │  07: Carry-Forward Controller    │
         │  → KnowledgeState[N+1]           │
         └──────────────┬───────────────────┘
                        ▼
              CSV Row [N+1] → Wave 0 restart
```

### System Layers
1. **Foundation Layer** (Wave 0) — ArtistProfile generation + KnowledgeState loading
2. **Intelligence Layer** (Wave 1, parallel) — Theory mapping + College link generation
3. **Synthesis Layer** (Wave 2) — Fleet research mission production (Opus-driven)
4. **Release Layer** (Wave 3) — Safety gate, publication, retrospective, state update

---

## Deliverables

| # | Deliverable | Acceptance Criteria | Component Spec |
|---|-------------|--------------------|--------------:|
| 1 | `ArtistProfile[360]` JSON array | All 360 rows parsed; no missing fields | `components/01-csv-intake-engine.md` |
| 2 | `TheoryNodeList` per artist | ≥3 theory concepts per artist; genre-appropriate | `components/02-music-theory-mapper.md` |
| 3 | Fleet research PDF per artist | Compiles with XeLaTeX; 3 stages; Safety Warden passed | `components/03-fleet-research-generator.md` |
| 4 | `CollegeLinkList` per artist | ≥3 department links; no duplicates across run | `components/04-college-knowledge-linker.md` |
| 5 | Release artifact set (360×) | All files present in `releases/seattle-360/NNN-[slug]/` | `components/05-release-pipeline.md` |
| 6 | `retrospective.md` per artist | ≥1 IMMEDIATE carry item; sourced | `components/06-retrospective-engine.md` |
| 7 | `knowledge-state.json` (final) | Atomic; complete theory genealogy; 360 entries | `components/07-carry-forward-controller.md` |
| 8 | Safety audit log (360×) | All releases PASS; BLOCK findings escalated | `components/08-safety-warden.md` |

---

## Component Breakdown

| # | Component | Wave | Track | Model | Est. Tokens/Artist | Depends On |
|---|-----------|------|-------|-------|---------------------|------------|
| 0 | Shared Types | 0 | — | Haiku | ~4K (once) | None |
| 1 | CSV Intake Engine | 0 | — | Haiku | ~2K | #0 |
| 2 | Music Theory Mapper | 1 | A | Sonnet | ~8K | #1 |
| 3 | Fleet Research Generator | 2 | — | Opus | ~20K | #2, #4 |
| 4 | College Knowledge Linker | 1 | B | Sonnet | ~6K | #1 |
| 5 | Release Pipeline | 3 | — | Sonnet | ~3K | #3, #8 |
| 6 | Retrospective Engine | 3 | — | Opus | ~8K | #5 |
| 7 | Carry-Forward Controller | 3 | — | Sonnet | ~4K | #6 |
| 8 | Safety Warden | 3 | — | Opus | ~6K | #3 |

**Per-artist token estimate:** ~57K (including KnowledgeState loading overhead)
**Total estimated token budget:** ~20.5M (360 × 57K)
**Opus fraction:** ~34K/57K = ~60% (justified by synthesis + safety complexity)
**Sonnet fraction:** ~17K/57K = ~30%
**Haiku fraction:** ~6K/57K = ~10% (Wave 0 only; amortized over 360)

---

## Activation Profile

**Profile:** Fleet (Full crew — 9 specialized components, 2 parallel tracks in Wave 1)

| Role | Agent (PNW Species) | Wave Presence | Responsibility |
|------|--------------------|--------------:|---------------|
| FLIGHT | RAVEN (orchestrator) | All waves | Go/No-Go authority; wave sequencing |
| PLAN | SALMON | Wave 0 | CSV ingestion; ArtistProfile generation |
| INTEL-A | CEDAR | Wave 1A | Music theory curriculum mapping |
| INTEL-B | ORCA | Wave 1B | College Knowledge deep-link generation |
| EXEC | HAWK | Wave 2 | Fleet research mission synthesis (Opus) |
| RELEASE | HERON | Wave 3 | Sequential release coordination |
| REVIEW | WARDEN | Wave 3 | Safety audit (BLOCK authority) |
| RETRO | OWL | Wave 3 | Retrospective lessons learned (Opus) |
| STATE | DOUGLAS-FIR | Wave 3 | KnowledgeState management; carry-forward |
| CAPCOM | Human-in-loop | BLOCK escalations | Reviews BLOCK-level safety findings |

---

## Constraints

- **Atomicity:** No partial releases. Either all 5 artifacts for artist N are committed,
  or none. Partial writes must be rolled back before proceeding.
- **Sequential guarantee:** Artist N+1 cannot begin Wave 0 until artist N's carry-forward
  write is confirmed. No lookahead parallelism across artists.
- **Safety Warden is mandatory:** No release publishes without Safety Warden PASS signal.
  BLOCK findings halt the pipeline and trigger CAPCOM notification.
- **Source quality:** All biographical claims in the research PDF require professional
  citation (Grove Music, AllMusic, KEXP, academic journals). Wikipedia is not a primary source.
- **Indigenous attribution:** OCAP®/CARE/UNDRIP compliance is a BLOCK-level requirement.
  Nation-specific language (Duwamish, Muckleshoot, Suquamish) always; never generic.
- **KnowledgeState compression:** The active-context summary must not exceed 2K tokens.
  Full state accumulates in `knowledge-state.json`; only the summary is loaded per mission.
- **LaTeX compilation:** XeLaTeX only (not pdflatex). Three passes. DejaVu font stack.
  Compilation failures are BLOCK-level findings.

---

## Pre-Computed Knowledge Tiers (per artist mission)

| Tier | Content | Size | Loading Strategy |
|------|---------|------|-----------------|
| Active Summary | KnowledgeState summary for agent context | ~2K | Always loaded in Wave 0 |
| Theory Genealogy | Full theory concept → artist linkage map | ~10K | Loaded by Mapper (Wave 1A) |
| College Node Index | All existing `.college/` nodes (to prevent duplication) | ~8K | Loaded by Linker (Wave 1B) |
| Artist Research | Sourced biographical + musical data (per artist) | ~15K | Loaded by Research Generator (Wave 2) |

---

## Go/No-Go Gates

| Gate | Condition | Owner | Action if Fail |
|------|-----------|-------|----------------|
| POST-WAVE-0 | ArtistProfile valid + KnowledgeState loaded | RAVEN | Halt; diagnose CSV issue |
| POST-WAVE-1 | TheoryNodeList ≥3 items + CollegeLinkList ≥3 items | RAVEN | Retry component; escalate if 2nd fail |
| POST-WAVE-2 | PDF compiles without XeLaTeX errors | HAWK | Retry with reduced content; CAPCOM if 2nd fail |
| PRE-RELEASE | Safety Warden PASS (no BLOCK findings) | WARDEN | Halt; CAPCOM escalation; do not publish |
| POST-RELEASE | All 5 artifacts written + verified | HERON | Roll back; alert CAPCOM |
| POST-RETRO | RetrospectiveRecord committed + carry items tagged | OWL | Continue; log incomplete retrospective |
| POST-STATE | KnowledgeState[N+1] written atomically | DOUGLAS-FIR | Retry 3×; halt if persistent failure |
