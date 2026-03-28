# Seattle 360 — Wave Execution Plan

**Milestone:** Seattle 360 Continuous Artist Release Engine
**Total Waves per artist cycle:** 4 (0 → 1A/B → 2 → 3)
**Parallel tracks:** 2 (Wave 1A: Theory Mapper; Wave 1B: College Linker)
**Loop count:** 360 (one per degree)
**Resumability:** Yes — engine reads `progress.json` on start; skips completed artists

---

## Wave Summary (per artist cycle)

| Wave | Name | Mode | Models | Est. Tokens | Cache Benefit |
|------|------|------|--------|-------------|--------------|
| 0 | Foundation | Sequential | Haiku | ~6K | KnowledgeState summary cached |
| 1A | Theory Mapping | Parallel | Sonnet | ~8K | ArtistProfile cached from Wave 0 |
| 1B | College Linking | Parallel | Sonnet | ~6K | ArtistProfile cached from Wave 0 |
| 2 | Fleet Research | Sequential | Opus | ~20K | Theory + College outputs cached |
| 3a | Safety Audit | Sequential | Opus | ~6K | PDF cached from Wave 2 |
| 3b | Release | Sequential | Sonnet | ~3K | Safety pass cached |
| 3c | Retrospective | Sequential | Opus | ~8K | Release record cached |
| 3d | Carry Forward | Sequential | Sonnet | ~4K | RetrospectiveRecord cached |
| **Total** | | | | **~57K** | |

---

## Wave 0: Foundation (Sequential — Must complete < 5 min)

*Loads the artist context for this cycle. Wave 1 cannot start until Wave 0 is complete.*

| Task | Description | Produces | Model | Est. Tokens | Depends On |
|------|-------------|----------|-------|-------------|------------|
| 0.1 | Load `seattle_360_geo.csv` row [N] | `ArtistProfile[N]` | Haiku | ~1K | None |
| 0.2 | Validate ArtistProfile schema | Validation report | Haiku | ~0.5K | 0.1 |
| 0.3 | Load `knowledge-state.json` → extract 2K summary | `ActiveContext[N]` | Haiku | ~2K | None |
| 0.4 | Load `college-node-index.json` (existing nodes) | `CollegeIndex[N]` | Haiku | ~1.5K | None |
| 0.5 | Load `theory-genealogy.json` (concepts seen so far) | `TheoryGenealogy[N]` | Haiku | ~1K | None |

**Wave 0 output bundle:** `{ArtistProfile, ActiveContext, CollegeIndex, TheoryGenealogy}`
All outputs are cached for Wave 1 consumption.

---

## Wave 1: Intelligence (Parallel — Tracks A and B run simultaneously)

*Track A and Track B receive the same Wave 0 bundle. No inter-track communication in Wave 1.*

### Track A: Music Theory Mapping (CEDAR agent / Sonnet)

| Task | Description | Produces | Model | Est. Tokens | Depends On |
|------|-------------|----------|-------|-------------|------------|
| 1A.1 | Map genre → theory domain (§3 of research ref) | `GenreTheoryMap` | Sonnet | ~2K | 0.1, 0.3 |
| 1A.2 | Map era → theory vocabulary (§4 of research ref) | `EraVocabulary` | Sonnet | ~1.5K | 0.1, 0.3 |
| 1A.3 | Map energy level → curriculum depth (1–3=found; 4–6=inter; 7–10=adv) | `CurriculumDepth` | Sonnet | ~0.5K | 0.1 |
| 1A.4 | Identify cross-era connections from TheoryGenealogy | `GenealgyLinks` | Sonnet | ~2K | 0.5 |
| 1A.5 | Assemble `TheoryNodeList` (≥3 nodes, ≤8 nodes) | `TheoryNodeList[N]` | Sonnet | ~2K | 1A.1–1A.4 |

**Track A output:** `TheoryNodeList[N]` — minimum 3, maximum 8 theory concepts, each with:
- concept name, definition, curriculum level, audible example (track/structural ref),
  College node target path, genealogy linkage (prior artist using same concept)

### Track B: College Knowledge Linking (ORCA agent / Sonnet)

| Task | Description | Produces | Model | Est. Tokens | Depends On |
|------|-------------|----------|-------|-------------|------------|
| 1B.1 | Map artist genre/era to College department primary targets | `DeptTargets` | Sonnet | ~1.5K | 0.1, 0.4 |
| 1B.2 | Check CollegeIndex for existing nodes to enrich (vs. create) | `EnrichList` + `CreateList` | Sonnet | ~2K | 0.4, 1B.1 |
| 1B.3 | Map mathematics bridges (frequency, rhythm, Fourier) | `MathBridgeList` | Sonnet | ~1K | 0.1, 0.5 |
| 1B.4 | Generate deep-link manifest (path + link type + description) | `CollegeLinkList[N]` | Sonnet | ~1.5K | 1B.1–1B.3 |

**Track B output:** `CollegeLinkList[N]` — minimum 3, maximum 12 links, each with:
- `.college/` path, link type (CREATE/ENRICH), description, mathematical bridge flag

---

## Wave 2: Fleet Research Generation (Sequential — HAWK/Opus)

*Synthesis wave. Receives all Wave 1 outputs. Produces the publication artifact.*

| Task | Description | Produces | Model | Est. Tokens | Depends On |
|------|-------------|----------|-------|-------------|------------|
| 2.1 | Assemble full artist research context (biography + cultural) | `ResearchContext` | Opus | ~5K | 1A.5, 1B.4 |
| 2.2 | Write Stage 1: Vision Document (artist-specific) | LaTeX Stage 1 section | Opus | ~3K | 2.1 |
| 2.3 | Write Stage 2: Research Reference (sourced biography + theory) | LaTeX Stage 2 section | Opus | ~5K | 2.1, 1A.5 |
| 2.4 | Write Stage 3: Mission Package (College integration plan) | LaTeX Stage 3 section | Opus | ~4K | 1B.4, 2.2 |
| 2.5 | Assemble full `.tex` document + compile (XeLaTeX ×3) | `research-mission.pdf` + `.tex` | Sonnet | ~2K | 2.2–2.4 |
| 2.6 | Generate `index.html` (3-file landing page) | `index.html` | Sonnet | ~1K | 2.5 |
| 2.7 | Generate `knowledge-nodes.json` (College link manifest) | `knowledge-nodes.json` | Haiku | ~0.5K | 1B.4 |

**Wave 2 output bundle:**
- `releases/seattle-360/NNN-[slug]/research-mission.pdf`
- `releases/seattle-360/NNN-[slug]/research-mission.tex`
- `releases/seattle-360/NNN-[slug]/index.html`
- `releases/seattle-360/NNN-[slug]/knowledge-nodes.json`

---

## Wave 3: Release, Safety, Retrospective & Carry-Forward (Sequential)

*Critical path. Safety Warden runs before publication. Retrospective runs after.*

### Wave 3a: Safety Audit (WARDEN/Opus — BLOCK authority)

| Task | Description | Produces | Model | Est. Tokens | Depends On |
|------|-------------|----------|-------|-------------|------------|
| 3a.1 | Attribution audit (all biographical claims sourced) | Attribution report | Opus | ~2K | Wave 2 outputs |
| 3a.2 | Cultural sensitivity review (Indigenous, Black American, gender) | Sensitivity report | Opus | ~2K | Wave 2 outputs |
| 3a.3 | Living vs. deceased protocol check | Protocol report | Opus | ~1K | 0.1, Wave 2 |
| 3a.4 | Factual accuracy spot-check (3 claims per release) | Accuracy report | Opus | ~1K | Wave 2 outputs |
| 3a.5 | Emit PASS / GATE / BLOCK signal | Safety signal | Opus | ~0.5K | 3a.1–3a.4 |

**Gate:** If BLOCK → halt pipeline; write `BLOCKED-[slug].md`; notify CAPCOM. Do NOT proceed to 3b.

### Wave 3b: Release Publication (HERON/Sonnet)

| Task | Description | Produces | Model | Est. Tokens | Depends On |
|------|-------------|----------|-------|-------------|------------|
| 3b.1 | Write-protect Wave 2 artifacts | Immutable files | Sonnet | ~0.5K | 3a.5 PASS |
| 3b.2 | Update `progress.json` (N → COMPLETE) | `progress.json` | Sonnet | ~0.5K | 3b.1 |
| 3b.3 | Append to `release-ledger.md` (summary entry) | `release-ledger.md` | Sonnet | ~1K | 3b.2 |
| 3b.4 | Update `college-node-index.json` (add new/enriched nodes) | `college-node-index.json` | Sonnet | ~1K | 3b.1 |

### Wave 3c: Retrospective (OWL/Opus)

| Task | Description | Produces | Model | Est. Tokens | Depends On |
|------|-------------|----------|-------|-------------|------------|
| 3c.1 | Identify surprises (theory connections not predicted) | Surprise list | Opus | ~2K | Wave 2 outputs |
| 3c.2 | Identify College node promotions (concept at 5+ artists → full lesson) | Promotion candidates | Opus | ~1.5K | 0.5, 3c.1 |
| 3c.3 | Extract carry items (IMMEDIATE / PATTERN / ARCHITECTURAL) | Carry items | Opus | ~2K | 3c.1, 3c.2 |
| 3c.4 | Write `retrospective.md` (NASA SE lessons-learned format) | `retrospective.md` | Opus | ~2.5K | 3c.1–3c.3 |

### Wave 3d: Carry-Forward (DOUGLAS-FIR/Sonnet)

| Task | Description | Produces | Model | Est. Tokens | Depends On |
|------|-------------|----------|-------|-------------|------------|
| 3d.1 | Extract CONFIRMED carry items from retrospective | CONFIRMED list | Sonnet | ~1K | 3c.4 |
| 3d.2 | Update theory-genealogy (add this artist's theory concepts) | `theory-genealogy.json` | Sonnet | ~1.5K | 1A.5 |
| 3d.3 | Compress full KnowledgeState → 2K active summary | Updated active summary | Sonnet | ~1K | All above |
| 3d.4 | Write atomic `knowledge-state.json` (full) + summary | `knowledge-state.json` | Sonnet | ~0.5K | 3d.1–3d.3 |
| 3d.5 | Increment artist counter → if N < 359, trigger Wave 0[N+1] | Loop signal | Haiku | ~0.1K | 3d.4 |

**Loop termination:** When N = 359 (Unwound) and 3d.4 completes, emit CYCLE-COMPLETE signal.

---

## Cache Optimization Strategy

### Cache reuse across the 360-cycle loop
- **ArtistProfile schema** (from Wave 0 shared types) — loaded once by CSV intake; schema
  definition cached for all 360 iterations
- **Research reference document** (`02-research-reference.md`) — loaded once at engine
  start; cached as context for all 360 Theory Mapper runs
- **College node index** — incrementally updated after each release; loaded fresh per Wave 0
  but only the delta needs reading (cached base + append)
- **Theory genealogy** — same incremental pattern; grows ~2K per artist; compressed summary
  loaded each Wave 0
- **XeLaTeX packages** (tcolorbox, tabularx, etc.) — installed once at engine start;
  compilation environment cached

### Token Budget per Artist (Detailed)

| Component | Model | Est. Tokens | Notes |
|-----------|-------|-------------|-------|
| Wave 0 (all tasks) | Haiku | ~6K | Amortized Wave 0 is tiny |
| Wave 1A Theory Mapper | Sonnet | ~8K | Reads genre theory tables |
| Wave 1B College Linker | Sonnet | ~6K | Reads college node index |
| Wave 2 Research Generator | Opus | ~20K | Largest wave; synthesis |
| Wave 3a Safety Warden | Opus | ~6.5K | Reads full PDF for audit |
| Wave 3b Release | Sonnet | ~3K | Coordination only |
| Wave 3c Retrospective | Opus | ~8K | Deep lessons-learned |
| Wave 3d Carry Forward | Sonnet | ~4K | State management |
| **Total** | | **~61.5K** | ~22M total for 360 artists |

### Token Budget — Full 360-Run Summary

| Phase | Artists | Per-Artist | Subtotal |
|-------|---------|-----------|---------|
| Wave 0 (shared types, once) | 1 | 4K | 4K |
| Per-artist cycles | 360 | ~61.5K | ~22.1M |
| **Grand Total** | | | **~22.1M** |

---

## Dependency Graph

```
┌─────────────────────────────────────────────────────────────────────┐
│ WAVE 0: Foundation (Sequential, <5 min)                             │
│   CSV Row[N] ─────► ArtistProfile[N] ──────────────────────────┐   │
│   knowledge-state.json ──► ActiveContext[N] ──────────────────-─┤   │
│   college-node-index.json ─► CollegeIndex[N] ─────────────────-─┤   │
│   theory-genealogy.json ──► TheoryGenealogy[N] ────────────────-┘   │
└────────────────────────────────────────────────┬────────────────────┘
                                                 │ Wave 0 bundle
                          ┌──────────────────────┤
                          │                      │
                          ▼                      ▼
┌──────────────────────────────┐  ┌──────────────────────────────────┐
│ WAVE 1A: Theory Mapping      │  │ WAVE 1B: College Linking          │
│ (CEDAR/Sonnet — parallel)    │  │ (ORCA/Sonnet — parallel)          │
│                              │  │                                   │
│ ArtistProfile                │  │ ArtistProfile                     │
│   + ResearchRef §3, §4       │  │   + CollegeIndex                  │
│   + TheoryGenealogy          │  │   + MathBridge mapping            │
│   → TheoryNodeList[N]        │  │   → CollegeLinkList[N]            │
└──────────────┬───────────────┘  └──────────────┬────────────────────┘
               └──────────────┬──────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ WAVE 2: Fleet Research Generation (HAWK/Opus — Sequential)          │
│                                                                     │
│  ArtistProfile + TheoryNodeList + CollegeLinkList + ActiveContext   │
│      → research-mission.pdf (LaTeX, 3 stages)                       │
│      → research-mission.tex                                         │
│      → index.html                                                   │
│      → knowledge-nodes.json                                         │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                          ┌──────┴──────┐
                          ▼             ▼
               ┌─────────────────┐  (PDF sent to WARDEN)
               │ WAVE 3a: SAFETY │
               │ WARDEN (Opus)   │
               │ BLOCK authority │
               └────────┬────────┘
                  PASS  │  BLOCK → CAPCOM → halt
                        ▼
               ┌─────────────────┐
               │ WAVE 3b: RELEASE│
               │ (HERON/Sonnet)  │
               │ Publish + index │
               └────────┬────────┘
                        ▼
               ┌─────────────────┐
               │ WAVE 3c: RETRO  │
               │ (OWL/Opus)      │
               │ Lessons learned │
               └────────┬────────┘
                        ▼
               ┌─────────────────┐
               │ WAVE 3d: CARRY  │
               │ (DOUGLAS-FIR)   │
               │ state[N+1]      │
               └────────┬────────┘
                        │
                   N < 359?
                   YES: Loop to Wave 0[N+1]
                   NO:  CYCLE-COMPLETE signal
```

---

## Resumability Protocol

If the engine is interrupted at artist N:
1. On restart, read `progress.json` to find last COMPLETE artist
2. If last complete = M < N: resume at M+1
3. If M+1 artifacts are partially written: roll back M+1 artifacts, resume at M+1
4. If Safety Warden BLOCK is pending: wait for CAPCOM resolution before resuming
5. `knowledge-state.json` from M is the valid seed for M+1

The engine never re-processes completed (write-protected) artists.
