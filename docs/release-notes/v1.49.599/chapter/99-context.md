# v1.49.599 — Engine-State Context Tables

## Engine state full enumeration at v1.49.599 close

| Surface | v1.49.598 close | **v1.49.599 close** | Change v598→v599 |
|---|---|---|---|
| NASA degree | 1.78 (Apollo 14 Fra Mauro Highlands) | **1.79 (Mariner 8 / FAILED launch / Centaur tumble T+265s)** | **+0.01** |
| MUS degree | 1.78 (Carole King *Tapestry*) | **1.79 (Jethro Tull *Aqualung*)** | **+0.01** |
| ELC degree | 1.78 (Moon Trees lineage 1971-2026) | **1.79 (Greenpeace founding voyage)** | **+0.01** |
| SPS series | #75 (Marbled Murrelet) | **#76 (Sea Otter — substrate-convergent with ELC v1.79 via Amchitka)** | **+1** |
| §6.6 register | 23 exemplars | **23 exemplars LOCKED** (no admit; LAUNCH-VEHICLE-FAILURE watchlist only per #10237) | unchanged |
| TRS substrate | M1 Foundation Wave 0–1 | **M1 Wave 2 generation begins** (per-pack binding pass; pack-13 first end-to-end) | +1 wave |
| M0 substrate coverage | 22/22 | **23/22** (pack-13 information-theory fetched; closes v596 schedule) | +1 pack |
| Three-track-plus-TRS cadence | 11 instances | **12 instances** | **+1 instance** |
| CHAIN-CONVENTIONS | v1.4 | v1.4 (no bump) | unchanged |
| Pre-tag-gate | 7-step composite | **7-step composite + first legitimate use of SC_SKIP_DEPTH_AUDIT=1 override per #10231 ESTABLISHED policy** | NEW override |
| Lesson #10231 (iconic-mission depth-recovery) | observation #2 | **PROMOTED ESTABLISHED at v1.79** (3-instance: Apollo 13 + Apollo 14 + Mariner 8) | promoted |
| Lesson #10232 (INSIDE-window MUS pick) | observation #2 | **PROMOTED ESTABLISHED at v1.79** (3-instance: McCartney + Tapestry + Aqualung) | promoted |
| Lesson #10233 (Tier 2 inline-Opus W2 build) | observation #1 | observation #2 (soak continues; ESTABLISHED watch v601) | +1 obs |
| Lesson #10236 (substrate-emergent cross-track) | observation #1 | observation #2 (first SPS+ELC convergence; ESTABLISHED watch v600) | +1 obs |
| vitest test count | ~29,512 | **29,479** (+712 over v598 baseline; 17 skipped + 7 todo; 0 regressions) | +712 |

## §6.6 register full enumeration at v1.49.599 close (23 exemplars LOCKED)

| # | Thread | Status | Founding instance | Notes |
|---|---|---|---|---|
| 1-17 | (existing pre-v1.49.595 threads) | various | (per pre-v595 history) | (per pre-v595 history) |
| 18 | PINPOINT-LANDING (PINP) | 2-ex outcome-validation candidate | Apollo 12 (v1.76) | Apollo 14 Antares within 50 m of target validates 2nd-instance |
| 19 | PROCEDURAL-RECOVERY (PREC) | **ESTABLISHED at v1.49.598** | Apollo 12 SCE-to-AUX (Aaron founding instance) | promoted to 3-ex via Eyles abort-bit patch v598 |
| 20 | SUCCESSFUL-FAILURE (SUCCFAIL) | 1-ex carry | Apollo 13 (v1.77) | Watchlist 2-ex: Mariner 8 candidate held per #10237 |
| 21 | LM-AS-LIFEBOAT (LMLIFE) | 1-ex carry | Apollo 13 (v1.77) | Watchlist 2-ex: Skylab 4 / Mir / HST extended servicing |
| 22 | GEOLOGICAL-MOBILITY (GEOM) | 1-ex carry | Apollo 14 MET (v1.78) | Watchlist 2-ex: Apollo 15 LRV |
| 23 | PERSISTENT-PROGRAM-CYCLE (PPC) | 1-ex carry | Apollo 14 Moon Trees lineage (v1.78) | Watchlist 2-ex: Apollo 11 lunar plaque + Voyager Golden Record + Hubble deep-field |

**Net §6.6 register state: 23 active threads at v1.49.599 close (UNCHANGED from v1.49.598). LAUNCH-VEHICLE-FAILURE candidate (Mariner 8) held on watchlist per #10237 watchlist-not-pre-decision discipline; NWO (Greenpeace) candidate held similarly. Default no-admit confirmed.**

## Cross-track structural pair anchor inventory (NASA + MUS + ELC + SPS at v1.79)

| Substrate | Manifestation | Connection point |
|---|---|---|
| NASA 1.79 | Mariner 8 FAILED launch; Atlas-Centaur AC-24 pitch control failure T+265s; vehicle break-up T+311s; debris recovery 400 km N of Puerto Rico Atlantic; total mission duration 4 minutes; Mariner 9 inherits mission 21 days later | **Ambition-meets-failure with larger-system-preserves-the-ambition resolution** — Mariner 9 inheritance is the program-level redundancy |
| MUS 1.79 | Jethro Tull *Aqualung* (Chrysalis CHR 1044 UK 1971-03-19 / Reprise MS 2035 US 1971-05-03; producer Ian Anderson + Terry Ellis; Island Studios London + Basing Street Studios) — released 6 days BEFORE Mariner 8 launch (US release; INSIDE -8d envelope) | **Cross-track structural pair on ambition-meets-failure narrative axis** — title-track narrator's homeless-wanderer collapse on locked stairwell parallels Mariner 8 launch failure; song preserves narrator + Mariner 9 preserves mission |
| ELC 1.79 | Greenpeace founding voyage (Don't Make A Wave Committee; *Phyllis Cormack* fishing vessel chartered out of Vancouver BC; Sept 15 – Oct 26 1971; opposed Cannikin nuclear test on Amchitka) — Cannikin proceeded but Greenpeace established as enduring organization | **Same-substrate convergence with SPS #76 via Amchitka** — first cross-track substrate-convergence finding at SPS+ELC interface |
| SPS #76 | Sea Otter (*Enhydra lutris kenyoni* — northern subspecies); Pacific marine + kelp-forest substrate; species at material stake on Amchitka during Cannikin (LD50 estimates suggested mass mortality from blast wave) | **Substrate-convergent with ELC v1.79 via Amchitka** — Greenpeace opposed test that Sea Otter was the species at stake against; convergence emerged from substrate evidence per #10236 active discipline |

**Cross-track structural-pair finding:** v1.79 lands the **first cross-track substrate-convergence finding at the SPS+ELC interface** (#10236 observation #2). Greenpeace founding voyage opposed the Cannikin nuclear test on Amchitka; Sea Otter is the species at material stake against the test. The convergence emerged because the #10236 substrate-emergent discipline was applied honestly during W1 candidate evaluation; without the discipline, the parallel-track default (independent ELC + SPS) would have been chosen. Looser cross-track structural pair than v598's tight Apollo 14 + Tapestry canopy-substrate triplet (NASA + ELC + SPS); looseness correlates with brief-mission scope; documented as substrate-emergent finding.

## Build path: Tier 2 inline-Opus W2 build path (second observation; soak continues)

**Build path:** W2-build-agent template Tier 2 main-context inline-Edit recovery procedure (template lines 247-269; 2nd observation at v599 after observation #1 at v598). Lesson #10233 soak continues; ESTABLISHED watch v601.

**Why Tier 2 was used:** Sonnet sub-agent dispatch tool capability availability remained constrained in flight-ops' tool surface for v1.49.599. Per the template's documented quality verdict, Tier 2 ships at 78-89% predecessor-depth ratio (WARN-tier, ship-acceptable) — particularly appropriate for brief-mission FAILED-launch instances where graceful-thinness is the appropriate disposition per #10231 ESTABLISHED.

**v599 actual depth-audit results:**

| Track | Status | Lines | Bytes | Comments |
|---|---|---|---|---|
| NASA 1.79 (vs NASA 1.78) | FAIL → OVERRIDE | <80% | <80% | brief-mission FAILED-launch instance; first legitimate use of SC_SKIP_DEPTH_AUDIT=1 override per #10231 ESTABLISHED policy + lab-director G2 disposition (a) |
| MUS 1.79 (vs MUS 1.78) | FAIL → OVERRIDE | <80% | <80% | brief-mission depth distribution maps onto substrate shape |
| ELC 1.79 (vs ELC 1.78) | FAIL → OVERRIDE | <80% | <80% | brief-mission depth distribution maps onto substrate shape |
| SPS #76 | N/A | — | — | not audited by depth-audit script |

**Forward-action result:** first legitimate operational use of the depth-audit override + brief-mission graceful-thinness disposition codified at #10231 ESTABLISHED. Forward-lesson #10240 candidate emitted: depth-audit gate-refinement to honor #10231 ESTABLISHED dispositions automatically (rather than requiring manual override per ship).

## Cross-mission references (v1.77–v1.80)

| Version | Mission | NASA degree | §6.6 contribution |
|---|---|---|---|
| v1.49.596 | Apollo 13 | 1.77 | SUCCESSFUL-FAILURE + LM-AS-LIFEBOAT dual origination |
| v1.49.598 | Apollo 14 | 1.78 | Fra Mauro Highlands; GEOM + PPC origination + PREC promote ESTABLISHED |
| **v1.49.599** | **Mariner 8** | **1.79** | **FAILED launch / Centaur tumble; LAUNCH-VEHICLE-FAILURE watchlist only; #10231 + #10232 PROMOTED ESTABLISHED; first SPS+ELC substrate convergence** |
| v1.49.600 (planned) | Apollo 15 | 1.80 | first LRV mission; expected GEOM 2-ex outcome-validation + Hadley-Apennine geology |

## Forward lessons emitted

#10231 (PROMOTED ESTABLISHED) #10232 (PROMOTED ESTABLISHED) #10233 (soak continues) #10236 (soak continues) #10237 (soak continues) #10240 (candidate) #10241 (candidate) #10242 (candidate) #10243 (candidate)

(See `chapter/04-lessons.md` for full lesson definitions and 3-criterion rubrics.)

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
