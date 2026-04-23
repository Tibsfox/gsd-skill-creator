# Nonlinear Systems, Clouds, and the Open Frontier — Milestone Specification

**Date:** 2026-04-22
**Vision document:** `.planning/missions/nonlinear-systems-clouds/nonlinear-systems-clouds-open-problems.tex` Stage 1
**Research reference:** `.planning/missions/nonlinear-systems-clouds/work/FINAL.md` (17,207 words, 107 sources, 38/39 tests Pass)
**Estimated execution:** ~12 context windows across ~4 sessions

## Mission Objective

Convert the already-completed research pack into **live, queryable, teach-forward infrastructure** inside gsd-skill-creator. Done looks like:

1. **Pedagogical surface** — every one of the 19 newly-seeded concept files has an activated Rosetta panel (at minimum Python + C++ + one domain-appropriate third), with a `try-session` and a test case
2. **Research surface** — four live pages on tibsfox.com: `/Research/BLN/nonlinear-frontier/`, `/Research/CSP/soliton-resolution/`, `/Research/TIBS/merle-breakthrough-2026/`, `/Research/TIBS/erdos-1196-ai-proof/` — each generated from FINAL.md sections via `publish-pipeline`
3. **Simulation surface** — forest-sim (`www/tibsfox/com/Research/forest/simulation.js`) extended with (a) Köhler droplet activation from M4, (b) K41 canopy-flow turbulence from M2, gated behind a feature flag
4. **Tracking surface** — `ERDOS-TRACKER.md` wired to a live-pull script that refreshes AI-attempt status from `teorth/erdosproblems` wiki once per week; #143 (primitive sets Tier-2) elevated to active investigation since its sibling #1196 just fell to GPT-5.4 Pro

Every deliverable is testable; every test is attributable to a specific success criterion.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│   RESEARCH ARTIFACT (done)            MILESTONE DELIVERABLES (new)   │
│   ┌─────────────────┐                 ┌──────────────────────────┐  │
│   │ FINAL.md 17k w  │                 │  4 live web pages        │  │
│   │ PDF 55 pp       │                 │   on tibsfox.com          │  │
│   │ 107 sources     │─────drives──────▶│                          │  │
│   │ 39 tests Pass   │                 │  19 concept panels         │  │
│   └─────────────────┘                 │    activated              │  │
│           │                           │                          │  │
│           │                           │  2 sim extensions         │  │
│           │                           │   (Köhler + K41)         │  │
│           ▼                           │                          │  │
│   ┌─────────────────┐                 │  Live erdos-tracker       │  │
│   │ 19 concepts     │                 │   refresh pipeline        │  │
│   │  on disk        │                 │                          │  │
│   │                 │                 │  Test suite +34           │  │
│   │ ERDOS-TRACKER   │                 │                          │  │
│   │  enriched       │                 └──────────────────────────┘  │
│   └─────────────────┘                                               │
└─────────────────────────────────────────────────────────────────────┘
```

## System Layers

1. **Concept layer** — 19 concept files already written; need Rosetta-panel wiring (per `.college/rosetta-core/`), cross-refs, test cases
2. **Publication layer** — `publish-pipeline` skill converts FINAL.md + per-module cuts into HTML/PDF; FTP sync to tibsfox.com
3. **Simulation layer** — `forest/simulation.js` extended behind `featureFlags.microphysics` and `featureFlags.k41Turbulence`
4. **Tracking layer** — `scripts/erdos-refresh.py` polls `teorth/erdosproblems` wiki; updates ERDOS-TRACKER AI-attempt fields
5. **Cross-cutting** — every phase carries an explicit test-plan entry; cross-refs maintained into college + research + sim surfaces

## Deliverables

| # | Name | Acceptance criterion | Phase |
|---|------|---------------------|-------|
| D1 | 19 concept panels activated | Each concept has ≥3 Rosetta panels + try-session + 1 unit test; `npm test` stays green | P1 |
| D2 | 4 live web pages on tibsfox.com | Pages reachable; each renders correctly; `publish-pipeline` run recorded | P2 |
| D3 | forest/simulation.js Köhler extension | M4 §4 pseudocode ported to JS; gated behind flag; 5 test cases | P3 |
| D4 | forest/simulation.js K41 turbulence | M2 §5 scaling applied to canopy-flow sub-grid; gated; 3 tests | P3 |
| D5 | scripts/erdos-refresh.py | Pulls wiki weekly via cron; updates ERDOS-TRACKER fields; dry-run mode | P4 |
| D6 | #143 elevation write-up | Transfer-of-method plan from #1196 to #143; added to TIBS research series | P4 |
| D7 | Milestone test suite | +34 new tests (19 concepts + 8 publication + 5 sim + 2 erdos-refresh) | All |

## Component Breakdown

| Component | Depends on | Model | Tokens (est.) |
|-----------|-----------|-------|---------------|
| P1: Concept-panel wiring | (19 concept files on disk, done) | Sonnet | 25k |
| P2: Publication cuts + FTP | FINAL.md, publish-pipeline skill | Sonnet | 15k |
| P3: Forest-sim extensions | M2, M4 modules | Sonnet + Opus for K41 | 20k |
| P4: Erdos-refresh + #143 | ERDOS-TRACKER, teorth wiki | Sonnet | 8k |
| Test suite | All | Sonnet | 10k |

**Total estimate:** ~78k tokens / ~5 context windows / ~2 sessions.

## Success Criteria (12)

1. All 19 concept panels pass unit tests on `npm test`.
2. All 19 concepts appear in a department DEPARTMENT.md concepts table.
3. Four web pages live on tibsfox.com with correct meta + CSS.
4. Köhler extension verified: given a range of supersaturations, activation fraction matches Lohmann 2016 textbook figure within 5% tolerance.
5. K41 extension verified: simulated canopy sub-grid TKE scales as ε^(2/3) within fit tolerance.
6. `scripts/erdos-refresh.py` runs in under 60 s; dry-run produces identical diff twice in a row.
7. #143 elevation write-up lives at `www/tibsfox/com/Research/TIBS/erdos-143/` and cross-refs M6-open.md §3.
8. No regressions: existing `npm test` count stays at or above current 21,948.
9. ERDOS-TRACKER has a `last_refresh` timestamp field populated by the refresh script.
10. Every deliverable is backed by at least one test.
11. `publish-pipeline` run captured in `.planning/missions/nonlinear-systems-clouds/milestone-package/publish-log.md`.
12. All Safety Gates from the research mission (SC-SRC, SC-NUM, SC-ADV, SC-QUOTE, SC-TM, SC-VER) survive into published pages — no regression.

## Relationship to Other Documents

| Document | Relationship | Status |
|----------|--------------|--------|
| `work/FINAL.md` | Research base; source for web pages | Authoritative |
| `work/bibliography.md` | Bibliography; mirrored into web pages | Authoritative |
| `work/verification.md` | 38/39 Pass baseline; milestone test suite must not regress | Authoritative |
| `work/SYNTHESIS.md` | Cross-module synthesis; drives concept-panel relationships | Authoritative |
| `ERDOS-TRACKER.md` | Tracking target; P4 deliverable | Active, enriched |
| `.college/departments/*/concepts/` | 19 new concepts on disk | Awaiting panel wiring |
| `www/tibsfox/com/Research/forest/simulation.js` | Sim target; P3 deliverable | To extend |

## Through-Line

The research pack told us *where the frontier sits today*. This milestone bolts that knowledge into the substrate:
- **Concepts** so future conversations can summon soliton / K41 / Köhler / primitive-equations by name.
- **Pages** so the frontier is legible to the public from tibsfox.com.
- **Sims** so the mathematics runs, not just reads.
- **Tracker-refresh** so the boundary keeps moving on its own.

The Amiga principle in operation: small chips, wired at clear interfaces, producing outsized downstream leverage.

---

## Appendix — NLF Requirement Crosswalk (added at archival time, 2026-04-23)

The 12 numbered Success Criteria above are tracked in `REQUIREMENTS.md` under the `NLF-` prefix. For a self-contained audit trail, the mapping is preserved here:

| Success Criterion (above) | REQ-ID | Phase that satisfied it |
|---|---|---|
| 1. All 19 concept panels pass unit tests | NLF-01 | 679 |
| 2. All 19 concepts appear in DEPARTMENT.md | NLF-02 | 679 |
| 3. Four web pages live on tibsfox.com | NLF-03 | 679 (pre-seeded from 2026-04-22 research dispatch) |
| 4. Köhler activation-fraction within 5% of Lohmann 2016 | NLF-06 | 681 Plan 01 |
| 5. K41 sub-grid TKE scales as ε^(2/3) | NLF-07 | 681 Plan 02 |
| 6. `erdos-refresh.py` under 60 s + idempotent | NLF-09 | 682 |
| 7. #143 elevation write-up live | NLF-10 | 682 |
| 8. No regressions vs 21,948 baseline | NLF-11 | 683 |
| 9. ERDOS-TRACKER `last_refresh` populated | NLF-09 | 682 |
| 10. Every deliverable backed by a test | NLF-12 | 683 |
| 11. `publish-pipeline` run captured in `publish-log.md` | NLF-04, NLF-05 | 680 |
| 12. All Safety Gates survive into published pages | NLF-08 | 681 (flag-off preservation) + 680 (SC gates) |

Mapping note: NLF-01 through NLF-12 are the canonical IDs used by REQUIREMENTS.md and the per-phase SUMMARY.md files. The spec's numbered criteria (1-12) predate the ID promotion; the mapping above is 1:1 within a criterion but some REQ-IDs span multiple criteria (e.g. NLF-08 "featureFlags default off" is what operationally satisfies criterion 12's Safety Gate preservation for the microphysics module). See `RETROSPECTIVE.md` alongside this archive for the authoritative per-REQ summary.
