# v1.49.595 — Engine State Tables

## §6.6 Register at v1.76 close (19 exemplars)

| # | Thread | Origin | Status |
|---|---|---|---|
| 1 | (legacy threads pre-v1.49.585 audit) | various | ESTABLISHED |
| ... | ... | ... | ... |
| 14 | DRC (Dress-Rehearsal-Before-Commitment) | v1.74 Apollo 10 | 1-ex origination + outcome-validation 2nd-instance v1.75 |
| 15 | AUC (All-Up Commitment) | v1.64 Apollo 4 | ESTABLISHED 3-ex (Apollo 4 + 8 + 11); +4th outcome-validation instance v1.76 |
| 16 | (legacy thread 16) | (legacy) | ESTABLISHED |
| 17 | FCSC (First-Crewed-Surface-Contact) | v1.75 Apollo 11 | 1-ex origination; +2nd outcome-validation instance v1.76 |
| 18 | **PLND (Pinpoint-Landing)** | **v1.76 Apollo 12** | **NEW 1-ex origination** |
| 19 | **PREC (Procedural-Recovery)** | **v1.76 Apollo 12** | **NEW 1-ex origination** |

Watchlist 2-ex per thread:
- PLND: Apollo 14 Antares (Cone Crater approach); Mars Science Laboratory (Gale Crater 2012); Mars 2020 Perseverance (Jezero 2021)
- PREC: Apollo 13 lifeboat (Lovell crew recovery 1970); STS-51-F engine-out abort (1985-07-29); Soyuz T-10-1 launch-pad abort (1983-09-26); Soyuz MS-10 ascent abort (2018-10-11)

## MUS Domain Register at v1.76 close (13 domains)

| Domain | Name | Origin | Status |
|---|---|---|---|
| 1 | Pitch (sustained-pitch as identity) | v1.65 | ESTABLISHED |
| 2 | Rhythm & meter | v1.7 | ESTABLISHED |
| 3 | Harmony | (legacy) | ESTABLISHED |
| 4 | Counterpoint | v1.8 | ESTABLISHED |
| 5 | Form (architectural Side 2 medley) | v1.66 | ESTABLISHED 6/6 |
| 6 | Timbre | (legacy) | ESTABLISHED |
| 7 | Production | (legacy) | ESTABLISHED |
| 8 | Notation | (legacy) | ESTABLISHED |
| 9 | Acoustics | (legacy) | ESTABLISHED |
| 10 | Computational | (legacy) | ESTABLISHED |
| 11 | History | v1.74 (rock opera 1-ex) | 1-ex |
| 12 | Era-Closing Album / Goal-Achieved | v1.75 Abbey Road | 1-ex |
| 13 | **Hard Rock Foundation / Genre-Defining Sophomore** | **v1.76 Led Zeppelin II** | **NEW 1-ex** |

Watchlist for Domain 13 2-ex: Black Sabbath debut (1970-02-13); Deep Purple *In Rock* (1970-06-03); Cream *Wheels of Fire* (1968-08; possible retro 1-ex).

## ELC Track Sub-Threads

| Sub-thread | Origin | Stages |
|---|---|---|
| Powered-descent terrain-sensing radar | v1.73-1.75 | Apollo 9 Earth-orbit RR (185 km) → Apollo 10 lunar-orbit RR (628 km) → Apollo 11 lunar-surface LR (60K ft → 0 ft) — CLOSED at v1.75 |
| **LONG-DURATION-LUNAR-SURFACE-SCIENCE** | **v1.76 ALSEP** | **NEW 1-ex origin: Apollo 12 ALSEP (1969-1977 8-year operational life)** |

Watchlist for long-duration thread: Apollo 14/15/16/17 ALSEPs (5-ex stable through 1972); Voyager 1+2 (1977 launch heliospheric extension); ISEE-3/ICE (1978-2014 heliospheric multi-decade).

## SPS Series

| # | Species | Class | Origin Notes |
|---|---|---|---|
| 70 | Common Raven | Aves (Corvidae) | Persistent-constellation thread |
| 71 | Steller's Jay | Aves (Corvidae) | Corvid-family continuation |
| 72 | American Marten | **Mammalia (Mustelidae)** | **First MAMMAL exemplar (origination at v1.75)** |
| 73 | **Pacific Marten** | **Mammalia (Mustelidae)** | **Second MAMMAL exemplar (paired-species sister-split 2013)** |

## TRS M0 Wave Status

| Wave | Status | Packs | Records |
|---|---|---|---|
| Wave 1a | DONE (v1.49.589) | 1-4 fetched | initial corpus |
| Wave 1b/c retry | DONE (v1.49.590) | 5-12 fetched | +103 records |
| Wave 1d | DONE (v1.49.591) | 13-16 fetched | +20 records |
| Wave 1e | DONE (v1.49.592) | 17-22 backfill | +45 records (master.json 260 → 305) |
| Wave 2a synthesis | DONE (v1.49.593) | 1-8 synthesized | 91/91 claims; ~44,100 words |
| Wave 1.5 pack-08 | DONE (v1.49.594) | pack-08 closure | +8 records (305 → 313) |
| Wave 2b synthesis | DONE (v1.49.594) | 9-16 synthesized | ~31,156 words (terse vs target) |
| Wave 1.5 pack-09 | **DONE (v1.49.595)** | **pack-09 closure** | **+11 records (313 → 324)** |
| Wave 2c synthesis | **DONE (v1.49.595)** | **17-22 synthesized** | **~38,798 words (target-band hit; #10224 retracted)** |

Remaining Wave 1.5 fetches: pack-10 abstract-algebra (zero pack-tagged); pack-11 topology (zero); pack-12 category-theory (zero); pack-13 information-theory (sparse). 1-pack-per-milestone counter-cadence to close all by v1.49.599.

## Operational Gates Status at v1.76 close

| Gate | Status |
|---|---|
| `tools/pre-tag-gate.sh` step 1 (npm run build) | LIVE |
| step 2 (npx vitest run) | LIVE — 28,767 tests baseline |
| step 3 (check-completeness --strict) | LIVE |
| step 4 (CI-on-dev verification) | LIVE |
| step 5 (www-bundles esbuild) | LIVE |
| step 6 (depth-audit BLOCKER) | LIVE |
| step 6 cross-link strict mode | **NEW LIVE at v1.49.595+ (BLOCKER cutover via --cross-link-strict flag)** |

## Carry-Forward Queue for v1.49.596 W0

1. **HEADLINE:** Third-instance dev/main sync soak (#10221 ESTABLISHED candidate at v1.49.597 if zero-drift maintained)
2. Composite-pass third-soak observation (#10225 + #10227 candidates)
3. Pack-10 abstract-algebra Wave-1.5 fetch (1-pack-per-milestone counter-cadence)
4. Document #10215+#10223+#10228 recovery-pattern inventory in W2-build-agent-prompt template
5. NASA 1.77 forward-cadence (Apollo 13 — successful failure / lifeboat 2-ex PREC outcome-validation candidate)
6. Pack-11 + pack-12 + pack-13 Wave-1.5 fetches (counter-cadence pipeline)
7. Forest-sim simulation.js aggregator merge (~v1.49.615+; recurring counter-cadence)
8. SPS catalog 056-066 backfill (inherited)
9. Counter-cadence cleanup-mission #2 (per Lesson #10168 ~30-milestone cadence; ETA ~v1.49.615)

## Apollo 12 Brief-Error Corrections Applied

| BE | Popular claim | Correction (authority) |
|---|---|---|
| BE-01 HIGH | SCE-to-AUX call by Sy Liebergot | John Aaron EECOM Apollo 12; Gordon identified switch (Liebergot was Apollo 13) |
| BE-02 HIGH | Second lightning T+53 sec | T+52 sec canonical NASA primary (MSC-04112 §3.1) |
| BE-03 HIGH | Surveyor 3 retrieval = camera + scoop | 5 items (TV camera + soil scoop + TV cable segment + 2 aluminum tube sections) per NASA SP-235 Ch9 + MSC-04112 §7 |
| BE-04 HIGH | Streptococcus mitis confirmed lunar survival | Retracted (Venkateswaran 2011 LPI Contribution 1649; post-return contamination) |
| BE-05 HIGH | TV camera burned by Conrad ~30 min | Bean inadvertently pointed at Sun ~42 min EVA-1 (NASA ALSJ "TV Troubles") |
| BE-06 MED | ALSEP "8 instruments" | 4 science experiment packages (PSE/LSM/SWS/SIDE-CCGE) + 1 engineering (DDE) |
| BE-07 MED | Conrad "small step" quote (truncated) | Full quote with "Whoopee!" opener; "small step for Neil but a long one for me" (height-related: Conrad 5'6", Armstrong 5'11") |
| BE-08 MED | Lunar samples ~35 kg | 34.35 kg actual |
| BE-09 LOW | (additional minor corrections) | (catalog) |
| BE-10 LOW | (additional minor corrections) | (catalog) |
