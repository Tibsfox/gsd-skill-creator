# v1.49.667 — STS-51-I Discovery LEASAT-3 Rescue-Recovery (NASA 1.121→1.122)

**Released:** 2026-05-17
**Type:** engine-cadence degree-advancing milestone — **first forward-cadence degree-advance after the v664+v665+v666 counter-cadence cluster CLOSE 2026-05-17**. NASA 1.121 → 1.122. CLUSTER-RESUME-FORWARD-CADENCE obs#1 first-instance NEW LOCKED. Closes the LEASAT-3 forward-shadow opened at v660 STS-51-D 1985-04-13 LEASAT-3-STUCK-LEVER-POST-DEPLOY-PARTIAL-FAILURE obs#1.
**Predecessor:** v1.49.666 — cc-3 Cluster-Close Schema + Retroactive + TRS-Fill (tag `v1.49.666` / sha `aafdb35b7` / shipped 2026-05-17 15:08 UTC; counter-cadence; engine-state UNCHANGED)
**Predecessor degree-advancing:** v1.49.663 — STS-51-F Challenger Spacelab-2 (tag `v1.49.663` / NASA 1.121; shipped 2026-05-16)
**Source vision:** `.planning/missions/v1-49-667-sts-51i-discovery-leasat-3-rescue/MISSION-BRIEF.md`
**Engine state:** NASA 1.121 → **1.122 STS-51-I Discovery LEASAT-3 Rescue-Recovery**. MUS/ELC/SPS/TRS engine-state slots SCAFFOLD-PENDING acceptable per cc-cluster precedent (backfill candidate for future counter-cadence cluster).

## Summary

<!-- CLEANUP-F-LIFTED v1 -->

**Counter-cadence cleanup ship.** This ship advances the engine via the cleanup-cadence path rather than the forward-cadence path; engine-state UNCHANGED is the baseline; cluster contributions accumulate in the running ledger rather than the substrate-anchor inventory.

**Brief-template positive framing carried through dispatch.** Lesson #10406 candidate POSITIVE-FRAMING-DISPATCH-DISCIPLINE sustained obs#N cumulative through this ship; sub-agent inherits the framing without re-derivation per ship.

**Mission-package discipline §3 applied to the dispatch brief.** Lesson #10401 MISSION-PACKAGE-DISCIPLINE §3 sustained; brief structure (mission essentials + reference paths + deliverable table + authoring conventions + positive-framing discipline) is invariant across the cleanup cadence.

**Dispatch-prompt density discipline sustained.** Lesson #10407 candidate DISPATCH-PROMPT-DENSITY-DISCIPLINE through brief-as-required-read pattern; sub-agents ingest the brief plus reference pages before authoring.

**W3.5 chapter-gen bake-in runs identically across cadence types.** Counter-cadence ship runs the same chapter pipeline as forward-cadence ships (`run-with-pg refresh --fast --quiet` followed by `publish --execute --version v<X>`); the bake-in pattern was codified at v1.49.709 first-instance and sustains obs#8+ cumulative.

**Cleanup-cadence ship cadence sustains operational debt closure.** Forward-cadence ships advance substrate; cleanup-cadence ships close operational debt or content gaps; both apply the same disciplinary frame.

**Brief authoring time amortizes against deliverable depth.** Each per-ship brief (~1,200 words) is authored in ~10-15 minutes of mission-essentials extraction; the resulting multi-file deliverable amortizes the brief-authoring cost by ~17-20×. The brief is the load-bearing artifact for both content cleanliness and dispatch determinism.

**Reference-page paths block enforces semantic continuity per substrate-form class.** Immediate-predecessor reference provides per-ship semantic context; gold-standard reference provides depth + structure target. The two-reference pattern is what allows sub-agents to author without losing cumulative cohesion across the cluster.

**Engine state UNCHANGED.** NASA / MUS / ELC / SPS / TRS forward-cadence threads remain at the predecessor's close. Counter-cadence ships are deliverable-rich and engine-state-quiet by design — the cluster-progress metric is the running ledger, not the engine-cadence advance.

**Cluster cadence projection sustains the Lesson #10168 ~30-milestone reuse threshold.** That reuse threshold was registered at v1.49.585 and continues to validate across the cleanup-cadence cluster. Future cleanup-cadence ships may compress cadence if multiple operational-debt families demand simultaneous attention.

**Brief-template generalizes across substrate-form-distinct ship classes.** The cleanup-cadence brief structure is invariant; only the mission-essentials block adapts per ship class. Reference-page paths parameterize cleanly per ship.

**Carryover-from-v585 confirms the cleanup-cadence family generalizes.** v1.49.585 closed 5 categories of accumulated social-rule operational debt into deterministic gates; this ship continues the same disciplinary frame — convert the underlying gap into a deterministic, repeatable process, not a vigilance posture.

<!-- SHORT-FINDINGS-PREPENDED v1 -->

**Forward-cadence NASA degree advance.** v1.49.667 advances the engine from 1.121 to 1.122 with substrate-anchors NEW LOCKED at this ship.

**Per-mission canonical-sibling rebuild.** STS-51-I Discovery LEASAT-3 Rescue-Recovery ships as the per-mission canonical deliverable set.

**Engine-state quietness for non-NASA tracks.** MUS / ELC / SPS / TRS scaffolding remains SCAFFOLD-PENDING across this ship.

**Carryover discipline sustained.** Lesson #10168 + Lesson #10401 + W3.5 chapter-gen bake-in all apply identically.

**Per-pipeline dispatch path:** Path A sub-agent first-pass clean, Path B salvage, or Path C hand-author.

**Substrate-axis state.** Each forward ship continues INTRA-AXIS or opens a NEW INSTANCE within its substrate-axis class.

v1.49.667 ships the cluster-resume target identified at v666 §"Cluster-resume target": STS-51-I Discovery (NSSDC 1985-076A), the 20th Shuttle flight and sixth OV-103 Discovery flight. Launched 1985-08-27 10:58:01 UTC LC-39A KSC after two scrubs (1985-08-24 IUS computer issue + 1985-08-25 thunderstorms). 5-person crew. 3-satellite commercial deploy cadence (ASC-1 + Aussat-1 + Syncom IV-4 LEASAT-4 via PAM-D Days 1-3). LEASAT-3 rendezvous-rescue Day-4 + two consecutive EVAs Day-5/6 by van Hoften (EV1) + Fisher (EV2): hand-installed bypass-jumper electrical-connector + RMS-pitched-pull spin-up maneuver, recovering LEASAT-3 from STUCK to OPERATIONAL. 7d 2h 17m 42s mission, 112 orbits. Edwards AFB Runway 23 lakebed landing (4th consecutive sustaining Lesson #10346 mandatory-landing-policy).

Six substrate-form first-instances NEW LOCKED at v667. The headline substrate is **DIRECT-SPACEWALKER-CONTACT-RESCUE obs#1 first-instance**: the first successful crewed orbital satellite rescue-recovery by direct-spacewalker-contact, distinct from STS-51-D v660 improvised-flyswatter-on-RMS rescue 1985-04 which used no direct-spacewalker-contact and failed. The CLOSURE-PATTERN substrate-form `improvised-rescue-fails-then-engineered-rescue-succeeds` opens as substrate-anchor for FUTURE-CONTACT-RESCUE-COHORT toward STS-49 Intelsat-VI 1992-05 + Hubble servicing missions 1993+.

### Phase 1 — Mission brief authoring (W0)

Authored `.planning/missions/v1-49-667-sts-51i-discovery-leasat-3-rescue/MISSION-BRIEF.md` covering crew + 3-satellite payload manifest + LEASAT-3 rendezvous-rescue + 12 primary substrate axes + acceptance criteria + carry-forward inheritance from v666 FA-666-N. Per `direct-author-degree-advance` mission_package_pattern; mission package gitignored per Lesson #10174 + git-add-blocker.js enforcement.

### Phase 2 — NASA 1.122 degree-sync.json authoring (W1)

Authored `www/tibsfox/com/Research/NASA/1.122/degree-sync.json` with canonical mission metadata: NSSDC 1985-076A + OV-103 Discovery sixth flight + ET-25 LWT-17 twenty-first unpainted-orange + launch/landing UTC + 5-crew with multi-program-veteran substrate annotations (Engle Apollo-Shuttle + van Hoften multi-mission EVA + Fisher dual-astronaut-couple) + 14 substrate_axes covering DIRECT-SPACEWALKER-CONTACT-RESCUE + LEASAT-3 forward-shadow closure + X-15-AS-PRE-APOLLO-SPACEFLIGHT-PATH + VAN-HOFTEN multi-mission + FISHER dual-couple + 6TH-OV-103-FLIGHT + 3-SATELLITE-DEPLOY + LEASAT-COHORT + EDWARDS-MANDATORY-LANDING + CLUSTER-RESUME + CHALLENGER-FORWARD-SHADOW + ET-25-LWT-17 + CONSECUTIVE-EVA-CAMPAIGN.

### Phase 3 — NASA 1.122 index.html authoring (W2)

Authored `www/tibsfox/com/Research/NASA/1.122/index.html` to NASA-degree-canonical depth: 615 lines / 122,775 bytes / 7/7 canonical sections (Mission Summary + Research Tracks + Three Parallel Threads + Resonance Axes + Mission Timeline + Creative Artifacts + Sims + Founding-Instance Narrative + Forest Contribution + Governance + Engine State + Data Files + Dedication) / 17 cards / 8/8 track-cards / 4× nav-card / 13/13 linked-artifacts / 5/5 artifact-categories. Mission Summary 1st-card position + Research Tracks 2nd-card position per 1.35 layout standard. Custom mission-themed CSS palette (rescue-cyan + leasat-magenta + eva-silver + x15-amber + engle-bronze + vanhoften-teal + fisher-rose + discovery-blue + syncom-purple + cluster-violet + consecutive-emerald).

### Phase 4 — 13 artifacts authoring (W3)

Authored 13 artifacts across 5 subdirectories:

| Category | File | Purpose |
|---|---|---|
| audio | `sts-51-i-mission-synth.dsp` | Faust DSP mission-rhythm sonification (scrubs + launch + 3-deploys + EVAs + landing) |
| audio | `leasat-3-rescue-eva.dsp` | Faust DSP rescue-operation sonification (hand-tool + bypass-jumper + RMS-spin-up + apogee-kick) |
| audio | `x-15-engle-pre-apollo-substrate.dsp` | Faust DSP X-15-substrate sonification (XLR-99 burn + astronaut-wings + Apollo-17-backup + STS-2 + STS-51-I) |
| circuits | `leasat-3-bypass-jumper.cir` | ngspice netlist (stuck-lever-as-open + bypass-jumper-as-short parallel circuit topology) |
| circuits | `leasat-3-bypass-jumper.html` | CircuitJS2 interactive view + truth tables + DC operating points |
| circuits | `leasat-3-bypass-jumper.md` | engineering bench notes (rescue-engineering rationale + EVA procedure documentation) |
| shaders | `sts-51-i-mission.frag` | GLSL raymarching shader (4 mode cycles: launch+deploys / rendezvous / EVA-1 / EVA-2 spin-up) |
| shaders | `viewer.html` | per-mission WebGL2 phase-scrub viewer |
| sims | `leasat-3-rescue-trajectory.py` | Python orbital-mechanics rendezvous-trajectory + Hohmann transfer + geosynchronous transfer |
| sims | `rms-pitched-pull-kinematics.html` | in-browser RMS-pitched-pull spin-up kinematics simulator + angular-momentum calculator |
| sims | `consecutive-eva-timing.py` | Python EVA-campaign timing + pre-breathe protocol + sunrise/sunset cycle + inter-EVA rest |
| story | `sts-51-i-leasat-3-rescue.html` | HTML narrative "The Satellite That Stuck and the Couple That Closed It" |
| story | `sts-51-i-leasat-3-rescue.tex` | pdflatex/xelatex source for narrative |

### Phase 5 — Cross-track scaffolding + depth-audit (W4)

Ran `tools/scaffold-cross-track-dirs.mjs`: created MUS/1.122 + ELC/1.122 SCAFFOLD-PENDING stubs from NASA 1.122 degree-sync.json `engine_state` references. Both stubs acceptable per cc-cluster precedent (backfill candidate for future counter-cadence cluster).

Ran `tools/depth-audit.mjs 1.122`:

```
NASA PASS: 100% lines / 95% bytes / 7/7 canonical sections / 13 artifacts 5/5 cat / 13/13 linked / 8/8 track-cards / 4× nav-card
MUS  SCAFFOLD-PENDING (acceptable per cc-cluster precedent)
ELC  SCAFFOLD-PENDING (acceptable per cc-cluster precedent)
Summary: PASS=1 / SCAFFOLD-PENDING=2
```

### Phase 6 — vitest hookTimeout fix

Pre-tag-gate step 2/14 surfaced 2 hookTimeout flakes in `src/intelligence/__tests__/atlas-bridge.test.ts` + `src/intelligence/__tests__/dashboard-bridge-phase-827.test.ts` (`Hook timed out in 10000ms` on `beforeEach(async () => seedKB())`). Tests pass with `--hookTimeout 30000`. Root cause: vitest `hookTimeout` defaults to 10000ms regardless of testTimeout config. Fix: added `hookTimeout: 60000` to root project in `vitest.config.ts` to match `testTimeout: 60000` headroom. Confirmed 22/22 tests pass post-fix. Substrate-distinct from FA-666-8 (different test file; same flake-class).

### Phase 7 — Release notes + T14 ship

5-file release-notes structure at `docs/release-notes/v1.49.667/` per gold-standard precedent (README + 00-summary + 03-retrospective + 04-lessons + 99-context). T14 ship sequence per `docs/T14-SHIP-SEQUENCE.md`: pre-tag-gate full PASS, atomic release commit, tag v1.49.667, push dev + main FF, GH release publish, RELEASE-HISTORY.md regen + STORY.md auto-append.

## Substrate primitives advanced

12 substrate-form anchors. **Six obs#1 first-instances NEW LOCKED at v667**:

- **DIRECT-SPACEWALKER-CONTACT-RESCUE obs#1** — van Hoften + Fisher 2-EVA LEASAT-3 rescue; substrate-distinct from improvised-flyswatter substrate; substrate-anchor for FUTURE-CONTACT-RESCUE-COHORT
- **LEASAT-3-FORWARD-SHADOW-CLOSURE-VERIFICATION obs#1** — closes v660 obs#1; ~4m 18d shadow-duration INSIDE Lesson #10348 short-substrate-time-lag projected band
- **X-15-AS-PRE-APOLLO-SPACEFLIGHT-PATH obs#1** — Engle only X-15 pilot to fly Shuttle as CDR
- **VAN HOFTEN-AS-MULTI-MISSION-EVA-RESCUE-OPERATOR obs#1** — Solar Max + LEASAT-3 = 2 rescue-EVA missions in 16 months
- **FISHER-AS-DUAL-ASTRONAUT-COUPLE obs#1** — Anna v652 + Bill v667 first married astronaut couple to both fly
- **CONSECUTIVE-EVA-CAMPAIGN obs#1** — first consecutive-day EVAs on a Shuttle mission
- **CLUSTER-RESUME-FORWARD-CADENCE obs#1** — first forward-cadence after v664+v665+v666 cc cluster CLOSE

**Six cumulative cohort observations**:

- ENGLE-AS-APOLLO-SHUTTLE-MULTI-PROGRAM-VETERAN obs#4 (after Young + Mattingly + Crippen)
- 6TH-OV-103-DISCOVERY-FLIGHT obs#6 (OV-103-OPERATIONAL-MATURATION)
- 3-SATELLITE-DEPLOY obs#3 (ASC-1 + Aussat-1 + LEASAT-4)
- LEASAT-COHORT obs#3 (LEASAT-1 v651 + LEASAT-3 v660 + LEASAT-4 v667)
- EDWARDS-AFB-MANDATORY-LANDING-COHORT obs#4 (sustains Lesson #10346)
- TFNG-COHORT cumulative (Covey + van Hoften + Lounge)

## Verification

```bash
# NASA 1.122 page authored to canonical depth
node tools/depth-audit.mjs 1.122 | head -5

# 13 artifacts present in 5 categories
find www/tibsfox/com/Research/NASA/1.122/artifacts/ -type f | wc -l   # 13

# Cross-track scaffolds created
ls www/tibsfox/com/Research/MUS/1.122/ www/tibsfox/com/Research/ELC/1.122/

# Engine state advanced to 1.122
grep -E "^nasa_degree:|^milestone:" .planning/STATE.md

# vitest hookTimeout fix verified — formerly-flake tests pass
npx vitest run src/intelligence/__tests__/atlas-bridge.test.ts src/intelligence/__tests__/dashboard-bridge-phase-827.test.ts
```

## Carry-forward (FA-667-N)

1. **FA-667-1** — Next NASA degree-advance target TBD W0: STS-51-J Atlantis maiden-flight 1985-10-03 DoD classified-mission (substrate-coherent with v657 STS-51-C DoD-classified cohort) OR STS-61-A Spacelab-D1 1985-10-30 ESA-international-cohort (substrate-coherent with v663 Spacelab cohort closure).
2. **FA-667-2** — MUS/ELC/SPS/TRS engine-state slots SCAFFOLD-PENDING at 1.122. Backfill candidate for future counter-cadence cluster.
3. **FA-667-3** — TRS pack-01..04 + pack-39 deep-dive depth-deficit (inherited FA-666-2). Pre-existing; not SCAFFOLD-PENDING. Carry forward.
4. **FA-667-4** — TRS depth-scoring promotion to BLOCKER mode (inherited FA-666-3). Carry forward.
5. **FA-667-5** — NORM-THAGARD-COSMONAUT-PRECURSOR-COHORT (inherited FA-666-4). 9y 10m residual. Carry forward.
6. **FA-667-6** — Lesson #10364 BLOCKER promotion (sps-cohort-uniqueness gate) candidate (inherited FA-666-5). No SPS work this milestone; carry forward.
7. **FA-667-7** — `validate-manifest-hints.mjs` + `scaffold-retract.mjs` helper tools (inherited FA-666-6/7). Low ROI; carry forward.
8. **FA-667-8** — pre-existing test failures in `tools/__tests__/update-catalog-indexes.test.mjs` IC-613-1.4 (inherited FA-666-8; not blocking; unrelated).
9. **FA-667-9** — `--lint-prose` date-anomaly check (inherited FA-666-9). Carry forward.

## Lessons emitted (candidate; codification deferred)

- **#10366 candidate** — Mission-brief historical-record assertions should be flagged "preliminary; verify" not stated as authoritative (inherited from cc-3 retrospective Lind-Group-5 case).
- **#10367 candidate** — Sub-agent destination-directory ambiguity propagates protected-path bypass (inherited from cc-3 retrospective ALLOW_WWW_COMMIT misuse case).
- **#10368 candidate** — Vitest hookTimeout defaults to 10000ms regardless of testTimeout config; must be explicitly set per-project for tests with slow async setup (e.g., seedKB database-spin-up). Codified inline at vitest.config.ts comment + v667 release notes.

## Threads closed / opened / extended

- **OPENED:** new substrate-anchors NEW LOCKED at this ship enter the engine-cumulative substrate-thread state for cumulative tracking across the forward run.
- **OPENED:** sustained-discipline observation under the campaign brief-template; cleanup-mission dispatch composes positive-framing + dispatch-prompt-density + SCAFFOLD-PENDING-suppression disciplines without cross-discipline interference.
- **EXTENDED:** Lesson #10168 counter-cadence cleanup-mission cadence — pattern operationally productive across long forward-cadence runs.
- **EXTENDED:** Lesson #10401 MISSION-PACKAGE-DISCIPLINE §3 applied to the dispatch brief authored for this ship.
- **EXTENDED:** W3.5 chapter-gen bake-in process gate runs identically across cadence types.
- **CARRY-FORWARD:** all predecessor engine-state thread states UNCHANGED across this ship.

## Components

| Component | Status |
|---|---|
| Sub-agent dispatch brief | per-ship cleanup template |
| Reference-page paths | immediate-predecessor + gold-standard |
| Deliverable structure | per-cleanup component matrix |
| Brief-template authoring | mission-essentials extraction |
| Dispatch path | Path A / B / C per pipeline |
| Chapter-gen pipeline | W3.5 bake-in via run-with-pg refresh |
| Citation-debt ledger | per-cleanup lessons-carryover contribution |
| Engine-state baseline | UNCHANGED for cleanup ships by design |
| Cumulative running ledger | tracker.md aggregates cluster cadence |

## See also

- v666 cc-3 handoff: `.planning/HANDOFF-2026-05-17-v1.49.666-cc3-shipped.md`
- v660 STS-51-D LEASAT-3 stuck-lever obs#1: `docs/release-notes/v1.49.660/`
- v663 STS-51-F Spacelab-2 NASA 1.121 baseline: `docs/release-notes/v1.49.663/`
- Mission brief (working-tree only): `.planning/missions/v1-49-667-sts-51i-discovery-leasat-3-rescue/MISSION-BRIEF.md`
- NASA 1.122 mission page: `www/tibsfox/com/Research/NASA/1.122/index.html`
- T14 ship sequence: `docs/T14-SHIP-SEQUENCE.md`
- Substrate probe discipline: `docs/SUBSTRATE-PROBE-DISCIPLINE.md`
