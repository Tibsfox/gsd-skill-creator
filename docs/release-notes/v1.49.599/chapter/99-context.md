# v1.49.599 — Engine-State Context Tables

## NASA degree progression

| Version | Mission | Outcome | Date |
|---------|---------|---------|------|
| v1.77 | Apollo 13 | Successful failure / LM-as-lifeboat | 1970-04-11 to 1970-04-17 |
| v1.78 | Apollo 14 Fra Mauro | Success | 1971-01-31 to 1971-02-09 |
| **v1.79** | **Mariner 8** | **FAILED launch** | **1971-05-09 (4-min mission)** |

## MUS degree progression

| Version | Album | Artist | Release | Window position |
|---------|-------|--------|---------|-----------------|
| v1.77 | *McCartney* | Paul McCartney | 1970-04-17 | INSIDE Apollo 13 splashdown (zero-offset) |
| v1.78 | *Tapestry* | Carole King | 1971-02-10 | INSIDE Apollo 14 splashdown +1 |
| **v1.79** | ***Aqualung*** | **Jethro Tull** | **1971-05-03 (US)** | **INSIDE Mariner 8 launch -6** |

## ELC degree progression

| Version | Subject | §6.6 primitive |
|---------|---------|----------------|
| v1.77 | LM Aquarius lifeboat + CO2 mailbox | (subsumed under LM-AS-LIFEBOAT) |
| v1.78 | Moon Trees lineage | PERSISTENT-PROGRAM-CYCLE 1-ex origination |
| **v1.79** | **Greenpeace founding voyage** | **NONVIOLENT-WITNESS-OPPOSITION 1-ex origination CANDIDATE** |

## SPS species progression

| # | Species | Family | Substrate |
|---|---------|--------|-----------|
| #74 | Northern Spotted Owl | Strigidae | Old-growth forest interior (RAPTOR) |
| #75 | Marbled Murrelet | Alcidae | Old-growth canopy (seabird; canopy-substrate three-track pair with NASA + ELC at v1.78) |
| **#76** | **Sea Otter (E. l. kenyoni)** | **Mustelidae** | **Pacific marine + kelp forest (mammal; substrate-convergent with ELC v1.79 via Amchitka)** |

## §6.6 register state at v1.79 close

| Slot count | Most recent change |
|------------|--------------------|
| 23 | LOCKED at v1.78 close (GEOM admit + PPC admit + PREC ESTABLISHED); no change at v1.79 close (LAUNCH-VEHICLE-FAILURE candidate watchlist only per #10237) |

## TRS substrate progression

| Version | Substrate state |
|---------|-----------------|
| v1.49.587 to v1.49.596 | M0 substrate authoring (10-milestone arc; closed at v1.49.596) |
| v1.49.598 | M1 Wave 0–1 (Foundation: schemas + page-template + pairing-map skeleton) |
| **v1.49.599** | **M1 Wave 2 generation begins (first per-pack binding pass; pack-13 coverage report)** |
| v600+ | M1 Wave 2 continues (one pack per milestone over 8-10 milestones) |

## Soak observation register state at v1.79 close

| Soak ID | Title | Status at v1.79 close |
|---------|-------|----------------------|
| #10221 | dev/main sync | ESTABLISHED (v596) |
| #10231 | Iconic-mission depth-recovery | **PROMOTED ESTABLISHED at v1.79** |
| #10232 | INSIDE-window MUS pick | **PROMOTED ESTABLISHED at v1.79** |
| #10233 | Tier-2 inline-Opus W2 build path | SOAK CONTINUES (2nd inst; ESTABLISHED watch v601) |
| #10236 | Substrate-emergent cross-track epistemology | SOAK CONTINUES (2nd inst; ESTABLISHED watch v600) |
| #10237 | §6.6 watchlist-not-pre-decision | SOAK CONTINUES (2nd inst; passive) |
| #10239 | Lab-director G3-boundary | PATCH LANDED PRE-SPAWN at f4e607781 |

## Forward-lesson candidates at v1.79 close

| Candidate ID | Title | Forward action |
|--------------|-------|----------------|
| #10240 | Depth-audit gate-refinement to honor #10231 ESTABLISHED dispositions | Implement at v601+ |
| #10241 | MISSION-PROGRAM-REDUNDANCY-RESILIENCE §6.6 primitive lookback admit | Evaluate at first paired-mission ship |
| #10242 | Cross-track substrate convergence at SPS+ELC interface | Observation #2 at v600 if pattern recurs |
| #10243 | W1 research first-pass overshoot target ≥3850w | Apply at v600 W1 |

## Pre-tag-gate (7-step) results at v1.79 close

| Step | Check | Result |
|------|-------|--------|
| 1 | npm run build | PASS (no TS errors) |
| 2 | npx vitest run | PASS (29,479 tests; 0 regressions) |
| 3 | check-completeness.mjs --current --strict | PASS (5-file release-notes structure ≥200 bytes each) |
| 4 | CI-on-dev verification | (pending Phase 838) |
| 5 | tools/build-www-bundles.sh | (pending Phase 838) |
| 6 | tools/depth-audit.mjs --current | FAIL=3 → OVERRIDE per #10231 ESTABLISHED policy + lab-director G2 disposition (a); first legitimate use of SC_SKIP_DEPTH_AUDIT=1 |
| 7 | tools/render-claude-md.mjs --check | PASS (CLAUDE.md is up to date) |

## Pack-13 information-theory M0 substrate (closed at v1.79)

| Paper | Author | Year | Tier |
|-------|--------|------|------|
| Shannon 1948 *A Mathematical Theory of Communication* | Shannon | 1948 | 1-foundational |
| Kolmogorov 1965 *Three Approaches* | Kolmogorov | 1965 | 1-foundational |
| Rényi 1961 *On Measures of Entropy and Information* | Rényi | 1961 | 1-foundational |
| Tishby et al 2000 *Information Bottleneck Method* | Tishby/Pereira/Bialek | 2000 | 1-modern-foundational |
| Cover & Thomas 1991 *Elements of Information Theory* | Cover/Thomas | 1991 | 2-comprehensive-textbook |
| MacKay 2003 *Information Theory, Inference, and Learning* | MacKay | 2003 | 2-comprehensive-textbook |
| Jaynes 1957 *Information Theory and Statistical Mechanics* | Jaynes | 1957 | 1-foundational |
| Csiszár 1967 *Information-Type Measures of Difference* | Csiszár | 1967 | 1-foundational |

M0 substrate coverage at v1.79 close: 23/22 (pack-11 + pack-12 fetched at v598; pack-13 fetched at v599; closes v596 schedule).

## Cross-references

- `.planning/missions/v1-49-599-mariner-8-centaur-failure/MISSION-BRIEF.md` — full mission brief
- `.planning/missions/v1-49-599-mariner-8-centaur-failure/work/research/{nasa,mus,elc,sps}/research.md` — W1 research drafts
- `.planning/missions/v1-49-599-mariner-8-centaur-failure/work/synthesis/` — soak observation logs + §6.6 register evaluation
- `www/tibsfox/com/Research/NASA/1.79/` — NASA build artifacts (17 files)
- `www/tibsfox/com/Research/MUS/1.79/index.html` — MUS Aqualung
- `www/tibsfox/com/Research/ELC/1.79/index.html` — ELC Greenpeace founding voyage
- `www/tibsfox/com/Research/SPS/research/releases/076-sea-otter/pass2-refinement.md` — SPS #76 Sea Otter
- `.planning/research/packs/pack-13-information-theory/` — pack-13 8 paper stubs + README
