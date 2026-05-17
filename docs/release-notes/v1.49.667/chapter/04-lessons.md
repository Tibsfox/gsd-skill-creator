# v1.49.667 — Lessons

## Lessons applied (existing)

### Lesson #10174 — Mission packages not committed
Applied at W0. `.planning/missions/v1-49-667-sts-51i-discovery-leasat-3-rescue/MISSION-BRIEF.md` authored working-tree only; mission package never staged. `git-add-blocker.js` would have blocked any accidental staging.

### Lesson #10196 — Cluster-close forward-notes are load-bearing decisions
Applied at W0. The v666 handoff §"Cluster-resume target" identified STS-51-I as the v667 target; v667 executed that target. The cluster-close forward-note was load-bearing for the v667 milestone definition.

### Lesson #10250 — Partial-resolution state-machine discipline
Applied at W2 + W3. Future career trajectories for Covey (future STS-26 RTF + STS-61 Hubble CDR) + Lounge (future STS-26 + STS-35) + Anna Fisher (future ISS service) + van Hoften 2-flight career + CHALLENGER-FORWARD-SHADOW 5m 1d residual all recognized as forward-shadows without preemptive future-content revelation. Substrate-form OPEN-SHADOW preserved for subsequent milestone-page authoring.

### Lesson #10346 — EDWARDS-MANDATORY-LANDING-POLICY post-tire-burst
Applied as obs#4 cumulative validation. v667 Edwards AFB Runway 23 lakebed landing sustains the policy substrate-form opened at v661 post-v660-tire-burst. Four consecutive Edwards landings v661 + v662 + v663 + v667 validate substrate-form-stability at quaternary-cohort-instance.

### Lesson #10348 — Short-substrate-time-lag pattern
Validation confirmed at v667. Projected ~28d residual at v666 close → actual 4m 18d shadow-duration INSIDE projected band. The Lesson #10348 substrate-time-lag pattern is now validated across 2 instances (v661 LEASAT-1 + v667 LEASAT-3 closure pairs).

### Lesson #10356 — Four-consecutive-same-calendar-day-degree-advance-cluster threshold
v664+v665+v666 cluster closed on the substrate-form threshold response. v667 is the cluster-resume forward-cadence after that cluster CLOSE. The Lesson #10356 substrate-form has now been triggered + responded-to at one cluster-instance.

### Lesson #10364 — SPS cohort-uniqueness gate
No SPS work at v667 (SCAFFOLD-PENDING). The gate is in soak-mode at pre-tag-gate step 14/14; v667 does not exercise it. Gate-soak-mode-validation continues passively (no SPS work = no opportunity to surface gate behavior).

### Lesson #10365 — Scaffold-manifest hint validation
Applied at W1. The degree-sync.json + index.html authoring does not introduce speculative MUS/ELC/SPS/TRS content; the engine_state slots explicitly say "SCAFFOLD-PENDING" rather than speculate future-mission content. Zero-speculation discipline held cleanly.

## Lessons emitted (candidates; codification deferred)

### Lesson #10366 candidate — Mission-brief historical-record assertions should be marked "preliminary; verify"
**Pattern:** Inherited candidate from cc-3 retrospective (Lind ∈ Group 5 not Group 6 case). Re-validated at v667 W0: mission brief authoring relied on handoff substrate-axis projections (Engle X-15-Apollo-Shuttle multi-program-veteran framing was directly per substrate-anticipation precedent) without explicit "preliminary; verify" markers.

**Recommendation:** Codify the rule that mission-brief historical-record assertions (crew biographies, mission-vehicle counts, ET-LWT cohort-counting) should carry "preliminary; verify" markers OR explicit citation to source-of-truth (NSSDC catalog entry, NASA mission report, etc.). Substrate-form-correct alternative: explicit `verify_at_W1` field in mission-brief markdown for assertions not yet sourced.

**Codification deferred to v668+** unless re-triggered by additional substrate-precedent error.

### Lesson #10367 candidate — Sub-agent destination-directory ambiguity propagates protected-path bypass
**Pattern:** Inherited candidate from cc-3 retrospective (ALLOW_WWW_COMMIT misuse case where a sub-agent staged a doc to `www/...` requiring relocation). Not exercised at v667 (no sub-agent dispatch this milestone). Carry-forward pending.

**Codification deferred to v668+** unless re-triggered.

### Lesson #10368 candidate — Vitest hookTimeout defaults to 10000ms regardless of testTimeout config
**Pattern:** New at v667. Pre-tag-gate step 2/14 surfaced two hookTimeout flakes in `src/intelligence/__tests__/atlas-bridge.test.ts` + `src/intelligence/__tests__/dashboard-bridge-phase-827.test.ts`. Both tests use `beforeEach(async () => seedKB())` which spins up tmpdir SQLite + runs migrations; under full-suite contention this exceeds the default 10000ms hookTimeout.

**Root cause:** vitest's `hookTimeout` config defaults to 10000ms regardless of `testTimeout` config. The vitest.config.ts root project had `testTimeout: 60000` but no explicit `hookTimeout`. The fix adds `hookTimeout: 60000` to match testTimeout headroom.

**Substrate-distinct from FA-666-8** (different test file: update-catalog-indexes vs atlas-bridge). **Same flake-class**: slow-async-beforeEach-setup timing out under default-10s budget when actual setup needs 15-30s.

**Codification inline** at `vitest.config.ts` comment (substrate-anchor for future operators encountering similar flake-class). Formal codification to docs/test-discipline/ deferred unless re-triggered at another test file.

## Substrate-form opening declarations (forward-shadow management)

Per Lesson #10250 partial-resolution discipline:

- **CONSECUTIVE-EVA-CAMPAIGN substrate-form opens at v667** with forward-shadow toward Hubble Service Mission-1 STS-61 1993-12 (5 EVAs across 8 days; substrate-anticipation OPEN-SHADOW state through 8y 4m residual). Cohort-state declaration without future-content revelation.

- **MULTI-MISSION-EVA-RESCUE-OPERATOR substrate-form opens at v667** with forward-shadow toward Story Musgrave 3-mission-EVA-veteran (STS-6 + STS-51-F + future) + Jeffrey Hoffman + broader Hubble-servicing-mission EVA crews substrate-anchor. Cohort-state declaration without future-content revelation.

- **SPOUSAL-ASTRONAUT-COUPLE-AS-SUBSTRATE-FORM opens at v667** with forward-shadow toward subsequent NASA couples (Lee + Davis STS-47 1992; Hawley + Ride substrate-form-divergence). Substrate-state OPEN-COHORT declaration.

- **CLOSURE-PATTERN improvised-rescue-fails-then-engineered-rescue-succeeds substrate-form opens at v667** with forward-shadow toward STS-49 Intelsat-VI 1992-05 + Hubble servicing missions 1993+. Substrate-anchor for FUTURE-CONTACT-RESCUE-COHORT.

- **CLUSTER-RESUME-FORWARD-CADENCE substrate-form opens at v667** with forward-shadow toward future cluster-instance + post-cluster-resume target. Substrate-state OPEN-PATTERN-COHORT declaration.

## Cumulative cohort observations at v667

- ENGLE-AS-APOLLO-SHUTTLE-MULTI-PROGRAM-VETERAN obs#4 (after Young + Mattingly + Crippen)
- 6TH-OV-103-DISCOVERY-FLIGHT obs#6 (OV-103-OPERATIONAL-MATURATION cohort)
- 3-SATELLITE-DEPLOY-AS-OPERATIONAL-CADENCE obs#3 (ASC-1 + Aussat-1 + LEASAT-4)
- LEASAT-COHORT obs#3 (LEASAT-1 v651 + LEASAT-3 v660 + LEASAT-4 v667)
- EDWARDS-AFB-MANDATORY-LANDING-COHORT obs#4 (v661 + v662 + v663 + v667)
- TFNG-COHORT cumulative (Covey + van Hoften + Lounge + prior cohort members)
- INSTITUTIONAL-DIVERSITY-FIRSTS-COHORT cumulative (Fisher dual-astronaut-couple extends cohort)
- ET-25 LWT-17 #10331 obs#21 (twenty-first unpainted-orange external tank)
- #10287 obs#24 DIRECT-ORDER 26-of-26 anticipated (verify W4)
- #10346 substrate-anchor obs#4 cumulative (Edwards-mandatory-landing-policy)
- #10348 substrate-time-lag pattern validated obs#2 (LEASAT-1 v661 + LEASAT-3 v667)
- CHALLENGER-FORWARD-SHADOW continues 5m 1d residual to STS-51-L
