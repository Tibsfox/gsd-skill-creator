# 00 — Summary: v1.49.587 Surveyor 7 / Lady Soul / Northern Spotted Owl / SCIENCE-MAXIMIZED FINAL-OF-SERIES

**Released:** 2026-04-29
**Type:** combined three-track ship — (Track 1) NASA forward-cadence quartet at degree 68 + (Track 2) ship-pipeline hardening + NASA CSV reconciliation + (Track 3) The Rendered Space M0 Wave 0 (NEW)
**Closes:** ELC Pass-1 Domain 2 at 4/4 (small-signal models); ALPHA-SCATTERING §6.6 thread at 3-exemplar (S5+S6+S7); lunar-soft-lander era (Surveyors 1-7 series end)
**Opens:** SCIENCE-MAXIMIZED FINAL-OF-SERIES §6.6 thread origin candidate at single-exemplar; The Rendered Space TRS Track 3 (164-claim topic-map.json from 923-page first-draft PDF)
**Engine forward-state:** ADVANCED — degree 67 → 68 (18.9% complete; 292 remaining)

## Structural firsts

- **First Surveyor 7 entry in NASA corpus.** NSSDC 1968-001A; only Surveyor in lunar HIGHLANDS terrain; Tycho crater rim 40.97°S 11.44°W landing 1968-01-10; 21,038 photos returned over 45 days through 21 lunar nights against 1-night design lifetime.
- **First lunar HIGHLAND elemental composition entry in NASA / ELC corpus.** Anorthositic Al+Ca-rich, Fe+Mg-depleted vs maria-basaltic Surveyor 5 + 6 returns. Patterson, Turkevich et al. 1970 *Science* 168:825-828 final-results citation; first direct chemical evidence of compositional distinction between lunar highlands and maria.
- **First three-instrument simultaneous-deployment Surveyor entry in NASA corpus.** TV camera + alpha-scattering instrument + surface sampler all deployed at the same site at the same mission for the first time. Prior Surveyors carried subsets per engineering-test priority (S1 platform-only; S3 sampler-first; S5 alpha-only; S6 alpha-second). Surveyor 7 IS the science-maximized terminal mission of the series — the structural primitive declared at the §6.6 SMFS thread.
- **First Cm-242 alpha source entry in ELC corpus.** 163-day half-life, 6.11 MeV alpha. Brief had Cm-244; brief-error correction discipline at G0 gate replaced through G0-LOCKED-DECISIONS in all build artifacts.
- **First discrete-BJT charge-sensitive preamplifier entry in ELC corpus.** Surveyor alpha-scattering CSP signal chain: ~10⁵ e⁻ alpha pulse → 0.5 pF capacitive feedback (~32 mV peak / 50 µs decay) → 100 MΩ resistive feedback → CR-RC 1 µs shaping → 256-channel pulse-height analyzer. ELC Pass-1 Domain 2 closure exemplar.
- **First Aretha Franklin + *Lady Soul* + Atlantic Records entries in S36 corpus.** Aretha at the Columbia→Atlantic platform-qualification arc terminal output; the album as the work the qualified platform was always for. Released 1968-01-22, twelve days after Surveyor 7's Tycho landing — same structural primitive (qualified platform produces terminal-science / terminal-portfolio-peak output) within a 12-day window.
- **First Northern Spotted Owl + *Strix occidentalis caurina* entries in SPS corpus.** Founding-monograph reference catalog: Forsman, Meslow & Wight 1984 *Wildlife Monographs* 87 — published synthesis of the 12-year observational campaign 1972-1984. The species' ESA listing (1990) and 1994 Northwest Forest Plan reference back to this founding monograph. SPS #65; structural pair with SMFS at the conservation-ecology scale.
- **First MUS Pass-2 over-target advance second-instance.** Lady Soul Domain 3 advance over-target follows the v1.67 Mudhoney Domain 7 first-instance Pass-2 cadence template. Establishes the Pass-2 cadence as a reproducible pattern (not a one-off).
- **First ALPHA-SCATTERING §6.6 thread closure.** S5 (v1.62) opens; S6 (v1.63) confirms; S7 (v1.68) closes at 3-exemplar. Closure criterion: same instrument architecture deployed across compositionally-distinct lunar terrains validating discrimination capability. Pattern carries forward as a closed thread; future alpha-scattering deployments (Mars Pathfinder APXS 1997, MER 2003) reference it as inheritor architecture.
- **First lunar-soft-lander era closure.** Surveyors 1-7 (1966-1968) is a 7-mission series; Surveyor 7 closes it. Apollo era opens for crewed lunar surface science.
- **First NASA CSV Path-Y reconciliation.** v1.49.587 expands the canonical CSV by inserting Surveyor 7 at 1.68 (chronological backfill) + rewriting 1.66 = Pioneer 9 + 1.67 = OAO-2 to match shipped reality + shifting old 1.71+ rows +1. Idempotent atomic Python script at `tools/nasa-csv-path-y-reconciliation.py`. Strict version=chronology resumes from 1.72.
- **First three-track-plus-TRS forward-cadence milestone.** Track 3 The Rendered Space M0 Wave 0 ships in parallel with NASA + MUS + ELC tracks. TRS sliced into ~35-milestone cadence per `TRS-EXECUTION-MAP.md`; v1.49.587 ships the smallest atomic unit (PDF claim-extraction → 164-claim topic-map.json).
- **First two new HARD RULES in CLAUDE.md.** (a) "Before pushing to main, verify CI passes on dev first" — pre-tag-gate.sh step 4 enforces deterministically (override `SC_SKIP_CI_GATE=1` emergency only); (b) SPICE renderer bundle MUST be rebuilt before FTP-sync — pre-tag-gate.sh step 5 + `tools/build-www-bundles.sh` enforces.
- **§6.6 SCIENCE-MAXIMIZED FINAL-OF-SERIES thread origin candidate at single-exemplar (NEW).** Three founding-instance artifacts at three substrates (Surveyor 7 mission catalog + Lady Soul album + Forsman 1984 monograph) instantiate one structural primitive: engineering-qualified series produces terminal mission whose payload is dominated by science/artistic output. 3-criterion rubric documented in NASA + MUS + ELC + SPS subject-spec.json + cross-references/links.json.

## Engine state at close

| Metric | Value at v1.49.587 close |
|---|---|
| Degree | **68 of 360** (ADVANCED from 67; +1 forward) |
| Percent complete | **18.9%** (was 18.6%) |
| Pass | 2 (UNCHANGED) |
| Hard-gated forward-degree count | **9** (was 8; +1 forward) |
| §6.6 register exemplars | **12** (was 11; +1 with SMFS origin; ALPHA-SCATTERING moves to closed list) |
| §6.6 candidate variants | **6** (was 5; +1 SMFS, -0 ALPHA-SCATTERING moves to closed) |
| MUS Pass-1 | COMPLETE (UNCHANGED — closed at v1.66) |
| MUS Pass-2 | **second over-target advance** (Domain 3 Lady Soul; Domain 7 Mudhoney v1.67 first instance) |
| ELC Pass-1 Domain 2 | **CLOSED at 4/4** (was 3/4; +1 closure beat) |
| ELC era state | **op-amp era 2-exemplar** (was 1-exemplar at v1.67) |
| simulation.js block count | **#68 added** (canonical block at `forest-module/surveyor-7-highland-ejecta.js`) |
| Three-track-plus-TRS forward-cadence count | **1** (NEW pattern — first three-track-plus-TRS milestone) |
| Three-track forward-cadence count | **7** (was 6; +1) |
| Track 1 W2 build artifacts on disk | 49 files across NASA/MUS/ELC v1.68 (~698KB) |
| Track 3 TRS M0 Wave 0 deliverable | 164-claim topic-map.json (91.9 KB; 21/22 packs; 33/33 chapters) |
| NASA CSV row count | 449 → 450 (+1 OAO-2 insert; 1.66/1.67/1.68 rewrites + shift) |
| Pre-tag-gate steps | **5/5 PASS** (build + vitest + completeness + CI-on-dev + www-bundles) |
