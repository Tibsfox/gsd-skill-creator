# Wave Execution Plan — Nonlinear Systems, Clouds, Open Frontier Milestone

**Mode:** Parallel-where-safe, sequential-where-necessary.
**Total waves:** 4.
**Total phases:** 4 (P1 Concept Panels, P2 Publication, P3 Sim Extensions, P4 Tracker Refresh + #143).

## Wave Summary

| Wave | Purpose | Gating | Output | Parallelism |
|------|---------|--------|--------|-------------|
| W0 | Pre-flight (concept panels already on disk; ERDOS-TRACKER already enriched) | — | Verify upstream artifacts, confirm `npm test` baseline | Sequential |
| W1 | Concept-panel activation (P1) + Publication (P2) in parallel | W0 done | 19 panels wired, 4 web pages published | Parallel (2 tracks) |
| W2 | Sim extensions (P3) — Köhler then K41 | W1 done | forest-sim with flags | Sequential (Köhler → K41) |
| W3 | Tracker refresh + #143 (P4) + final test pass | W2 done | erdos-refresh.py + test suite + merge | Sequential |

## Wave 0 — Pre-flight (Sequential, Haiku + Sonnet)

| Task | Owner | Output | Tokens |
|------|-------|--------|--------|
| W0.1 | Haiku | Confirm 19 concept files on disk; grep each `export const` | 2k |
| W0.2 | Haiku | Run `npm test`; capture baseline test count (≥21,948) | 1k |
| W0.3 | Sonnet | Confirm ERDOS-TRACKER enrichment; grep for `erdosproblems.com: #` fields | 1k |
| W0.4 | Sonnet | Confirm PDF present, FINAL.md present, bibliography.md present | 1k |

Gate to W1: all four outputs Pass.

## Wave 1 — Track A (Concept Panels, Sonnet)

**P1.1–P1.19:** One sub-phase per concept. Each sub-phase does:
1. Read the concept .ts file
2. Read the source module (M1..M6) for domain context
3. Generate Rosetta panels for Python, C++, and one third panel per domain:
   - Mathematics concepts: add Lisp
   - Physics concepts: add Fortran
   - Chemistry/materials concepts: add Python (already) + Java
   - Data-science concepts: add Unison
   - Adaptive-systems concepts: add Lisp
   - Logic concepts: add Unison
4. Write a `try-session` for each panel
5. Write a unit test verifying concept id, relationships, complexPlanePosition

| Concept | Dept | Third panel | Tokens |
|---------|------|-------------|--------|
| solitons | math | Lisp | 1.5k |
| blow-up-dynamics | math | Lisp | 1.5k |
| scale-critical-equations | math | Lisp | 1.5k |
| reynolds-similarity | phys | Fortran | 1.5k |
| vorticity-stretching | phys | Fortran | 1.5k |
| k41-cascade | phys | Fortran | 1.5k |
| clausius-clapeyron | chem | Java | 1.2k |
| kohler-theory | chem | Java | 1.2k |
| wbf-mixed-phase | materials | Java | 1.2k |
| ice-nucleation-modes | materials | Java | 1.2k |
| aerosol-indirect-erf | env | Python (explicit) | 1.2k |
| wmo-cloud-taxonomy | env | Python | 1.2k |
| primitive-equations | phys | Fortran | 1.5k |
| data-assimilation-4dvar | ds | Unison | 1.2k |
| lorenz-predictability-limit | adapt-sys | Lisp | 1.2k |
| ai-weather-pipeline | ds | Unison | 1.2k |
| erdos-problem-index | math | Lisp | 1.2k |
| ai-verified-proof | logic | Unison | 1.2k |
| millennium-problem-catalogue | math | Lisp | 1.5k |

## Wave 1 — Track B (Publication, Sonnet)

| Task | Output | Tokens |
|------|--------|--------|
| P2.1 | Carve FINAL.md into four per-topic HTMLs via `publish-pipeline`: BLN-nonlinear-frontier, CSP-soliton-resolution, TIBS-merle-breakthrough, TIBS-erdos-1196 | 5k |
| P2.2 | Generate PDF of each per-topic HTML (pandoc + xelatex template) | 3k |
| P2.3 | FTP sync via `scripts/sync-research-to-live.sh` (must succeed without partial files; verify byte-for-byte after sync per `feedback_release-pipeline-quality`) | 4k |
| P2.4 | Update `www/tibsfox/com/Research/index.html` with links to the four new pages | 2k |
| P2.5 | Commit `publish-log.md` to `milestone-package/` | 1k |

**Tracks A and B run in parallel.** Track A finishes before B (A is ~25k tokens, B is ~15k); no shared files, no contention.

## Wave 2 — Sim Extensions (Sequential, Sonnet → Opus for K41)

| Task | Owner | Output | Tokens |
|------|-------|--------|--------|
| P3.1 | Sonnet | Implement Köhler droplet-activation function in `forest/simulation.js` behind `featureFlags.microphysics`. Port pseudocode from M4 §4. | 4k |
| P3.2 | Sonnet | Unit tests for Köhler: 5 test cases (dry, near-activation, supersaturated, aerosol sweep, temperature sweep) | 3k |
| P3.3 | Sonnet | Validate against Lohmann 2016 textbook figure (within 5%) | 2k |
| P3.4 | Opus | Implement K41 turbulence sub-grid closure; use ε^(2/3) scaling from M2 §5 | 5k |
| P3.5 | Opus | Unit tests for K41: 3 test cases (low-Re, high-Re, Kolmogorov-eta check) | 3k |
| P3.6 | Sonnet | Integration test: run forest-sim with both flags on for 100 steps; confirm no divergence | 3k |

Sequential because K41 extension may overlap Köhler's helper functions; shared editing avoids merge.

## Wave 3 — Tracker + #143 + Final Pass (Sequential, Sonnet)

| Task | Output | Tokens |
|------|--------|--------|
| P4.1 | `scripts/erdos-refresh.py`: polls teorth/erdosproblems wiki for any tracked entry, updates `ERDOS-TRACKER.md` AI-attempt fields; dry-run mode produces stable diff | 4k |
| P4.2 | Cron entry or systemd timer suggestion in `scripts/README.md` | 1k |
| P4.3 | #143 elevation write-up at `www/tibsfox/com/Research/TIBS/erdos-143/` — describes transfer-of-method plan from #1196 | 3k |
| P4.4 | Publish #143 page via publish-pipeline; FTP sync | 2k |
| P4.5 | Full `npm test` pass — zero regressions, +34 new tests | 2k |
| P4.6 | Update STATE.md milestone progression; commit all changes | 1k |

## Cache Optimization

- Concept source modules (M1..M6) are read once per wave; cache across P1 sub-phases
- `FINAL.md` and `bibliography.md` cached across P2 sub-phases (one content snapshot)
- `publish-pipeline` skill output cached across P2.3 and P4.4 FTP runs

## Token Budget

| Wave | Input | Output | Subtotal |
|------|-------|--------|----------|
| W0 pre-flight | 3k | 2k | 5k |
| W1 Track A | 18k | 12k | 30k |
| W1 Track B | 10k | 6k | 16k |
| W2 sim | 12k | 10k | 22k |
| W3 tracker | 8k | 6k | 14k |
| **Total** | **51k** | **36k** | **87k** |

## Dependency Graph

```
W0.1–4 (pre-flight)
     │
     ▼
┌────────────────┐     ┌────────────────┐
│ W1.A (concepts)│ ║ ║ │ W1.B (publish) │
│   19 sub-phases│ ║ ║ │   5 sub-phases │
└───────┬────────┘     └────────┬───────┘
        └──────────┬────────────┘
                   ▼
       W2.P3.1–6 (sim extensions, sequential)
                   │
                   ▼
       W3.P4.1–6 (tracker + #143 + test pass)
                   │
                   ▼
                 DELIVER
```

## Model Mix

- **Opus ~15%** — K41 turbulence closure (subtle nonlinear scaling; worth judgement model)
- **Sonnet ~75%** — most concept wiring, publication, tests
- **Haiku ~10%** — pre-flight checks, log curation
