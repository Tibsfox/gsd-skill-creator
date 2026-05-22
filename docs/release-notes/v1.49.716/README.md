# v1.49.716 — NASA Canonical Sibling Files Restoration Campaign Launch + v1.118 STS-51-D Discovery Rebuild

**Released:** 2026-05-21
**Type:** counter-cadence campaign-launch milestone (NOT a NASA degree)
**Predecessor:** v1.49.715 — SDO Solar Dynamics Observatory (NASA 1.168; SOLAR-OBSERVATORY substrate-axis third INTRA-AXIS continuation)
**Mission package:** `.planning/missions/v1-49-716-nasa-layout-restoration-campaign/`
**Engine state:** UNCHANGED (NASA degree remains at 1.168; MUS / ELC / SPS / TRS unchanged)
**Campaign target:** restore 14 canonical sibling files (research/papers/organism/mathematics/curriculum/simulation HTML + research.md + organism.md + knowledge-nodes.json + data-sources.json + forest-module + retrospective) for substrate-era missions v1.118–v1.168 that never received them under the v1.118+ build pipeline

## Summary

v1.49.716 launches the **NASA Canonical Sibling Files Restoration Campaign** and ships the first of its expected rebuild cycles: **v1.118 STS-51-D Discovery** receives the 14 canonical sibling files that v1.0–v1.117 missions all have but the v1.118-era build pipeline stopped producing. The campaign was queued during the v1.49.715 SDO ship session (mission package authored 2026-05-21) and triggered by a full QA scan showing 80% of 169 NASA mission pages deviating from the v1.0 canonical layout. The structural deviation was closed in the same v1.49.715 session via the canonical-layout gate + mechanical card-additive patcher (`tools/nasa-layout-restorer.mjs`); the residual scope was the per-mission deep content rebuild that this campaign addresses one mission per counter-cadence milestone.

**13 deliverable files (counting forest-module and retrospective subdirectories as composed paths) at `www/tibsfox/com/Research/NASA/1.118/`.** 6 track HTML pages (research, papers, organism, mathematics, curriculum, simulation) totaling ~17,180 words; 2 MD source files (research.md + organism.md) totaling ~6,054 words; 2 JSON metadata files (knowledge-nodes.json with ≥10 nodes; data-sources.json with v1.117 multi-category schema sources_nasa / sources_crew / sources_payload / sources_w1_research_docs / sources_music_cross_track / sources_elc_cross_track / sources_sps_cross_track); forest-module/NOT_APPLICABLE.md (v1.131 inline pattern, Shuttle-payload mission); retrospective/lessons-carryover.json (full inheritance + contribution schema) + retrospective/corpus-deltas.md (~500-word corpus-delta narrative). Total ~23,234 words across HTML+MD source.

**Mission rebuilt:** STS-51-D Discovery — OV-103's 4th flight; launched 1985-04-12 LC-39A; first politician in space (Garn US Senator); first woman physician in space (Seddon); first unscheduled in-flight improvised contingency EVA (Hoffman + Griggs; first improvised tool fabrication in orbit; first RMS-as-rescue-tool); first commercial-PS repeat flyer (Walker); Bobko CDR NASA Group 7 MOL-transfer 2nd career flight; Hughes Syncom IV-3 (Leasat-3) post-deploy activation-lever inertness pending future activation (FA-660-3 STS-51-I-LEASAT-3-RECOVERY-RECOVERY arc opens here). Engine state mappings: NASA 1.118 / MUS 1.118 Tom Petty Southern Accents (1985-03-26 MCA Records 5486) / ELC 1.118 Coca-Cola New Coke announcement (1985-04-23 NYC Lincoln Center) / SPS Brachyramphus marmoratus Marbled Murrelet (species #115; Alcidae / Charadriiformes / Aves).

## Cross-track / Engine state

- **No NASA / MUS / ELC / SPS forward-cadence content this milestone** — engine remains at NASA degree 1.168 (v1.49.715 close), MUS register unchanged at 1.118 (the v1.118 entry already existed via degree-sync.json), ELC unchanged, SPS unchanged, TRS pack-40 unchanged.
- **No new external citations** — all v1.118 sources are primary mission documentation (NSSDC 1985-028A, KSC STS-51-D Mission Report, Hughes Syncom IV documentation, Marbled Murrelet ESA listing documentation).
- **No new V-flags emitted** — the citation-debt ledger is unchanged.
- **Campaign-launch precedent** — registered as Lesson #10408 candidate (per-mission content-rebuild counter-cadence campaign as the model for closing structural-gate-vs-semantic-content gaps).
- **Sustained discipline:** Lesson #10401 MISSION-PACKAGE-DISCIPLINE applied to the v1.118 sub-agent dispatch brief (title-line trip-vocab = 0; body-secondary clean; framing positive throughout); Lesson #10406 candidate POSITIVE-FRAMING-DISPATCH-DISCIPLINE sustained obs#5 cumulative (v712 first ship + v713 + v714 + v715 + v716 first counter-cadence ship); Lesson #10407 candidate DISPATCH-PROMPT-DENSITY-DISCIPLINE sustained obs#4 cumulative; W3.5 chapter-gen bake-in unchanged (this counter-cadence ship runs the same chapter pipeline as forward-cadence ships).

## Threads closed / opened / extended

- **OPENED:** NASA Canonical Sibling Files Restoration Campaign (origin at v1.49.716; expected ~10 hard-bucket-mission rebuilds remain across substrate-era v1.159–v1.168 + v1.118 first-rebuilt-here + ~9 remaining v1.118-era to deepen at lower priority; cadence target 1 rebuild per counter-cadence ship). The campaign is the second counter-cadence cleanup-mission family registered (first was v1.49.585 concerns-cleanup), validating Lesson #10168 (counter-cadence cleanup-mission pattern operationally productive every ~30 forward milestones).
- **OPENED:** per-mission sub-agent rebuild pattern for substrate-era canonical sibling files (single dispatch ~36 tool uses for 13-file rebuild at v1.56 gold-standard depth ~23K words total; validates the brief template at `.planning/missions/v1-49-716-nasa-layout-restoration-campaign/brief-v1-118.md`).
- **EXTENDED:** v1.118 STS-51-D Discovery mission directory from 3-file substrate-era state (index.html + degree-sync.json + artifacts/) to 16-file canonical state (the 3 originals + 13 rebuilt sibling files; matching the v1.117 immediate-predecessor file count).
- **CARRY-FORWARD:** all v1.49.715 engine-state thread states UNCHANGED — SOLAR-OBSERVATORY substrate-axis remains at obs#3 INTRA-AXIS continuation; LONG-DURATION-OPERATIONAL-SUBSTRATE-ANCHOR obs#3 cumulative; INTERNATIONAL-HELIOPHYSICS-OBSERVATORY-NETWORK-SUBSTRATE-CUMULATIVE obs#4 cumulative; all forward-cadence threads unchanged.

## Forward lessons emitted

1 candidate lesson:

- **Lesson #10408 (candidate) — Per-mission sub-agent rebuild pattern for substrate-era canonical sibling files.** First-instance observation at v1.49.716. The single-dispatch pattern (one general-purpose sub-agent per mission, 5 Read + 13 Write tool uses, ~30-50 min budget, target v1.56 gold-standard depth not v1.117 latest-predecessor depth) produces clean ~23K-word 13-file deliverables for substrate-era missions that never received the canonical sibling files. Promotion-to-ESTABLISHED requires 3-5 clean campaign-ship observations across multiple substrate-era missions.

## Thread state

CHAIN-CONVENTIONS stays at v1.4 (no thread promotion this milestone). Counter-cadence cleanup-mission cadence sustained at obs#2 cumulative (first was v1.49.585; this is the second registered family). NASA Canonical Sibling Files Restoration Campaign cadence is a NEW operational-cadence sub-thread under the counter-cadence cleanup-mission family.

## Campaign progress

- **v1.118 STS-51-D Discovery** — REBUILT this milestone (13 files added)
- **Remaining hard-bucket rebuilds (substrate-era v1.159–v1.168):** 10 missions (per `.planning/missions/v1-49-716-nasa-layout-restoration-campaign/tracker.md`)
- **Remaining substrate-era v1.119–v1.158 deepening:** ~40 missions at lower priority (structural gate already passes; semantic sibling files would deepen these missions to v1.0 canonical depth)
- **Estimated campaign length:** 10–50 future counter-cadence milestones spread across forward-cadence ship cadence per Lesson #10168 (~every 30 forward milestones)

## Deliverables

This milestone produces 13 files in `www/tibsfox/com/Research/NASA/1.118/`:

- `research.md` — 3,062 words mission-narrative source MD
- `organism.md` — 2,992 words paired-species (Marbled Murrelet) source MD
- `knowledge-nodes.json` — ≥10 nodes covering mission / vehicle / crew / payload / EVA / substrate-axis entries with v1.117 schema
- `data-sources.json` — multi-category sources matching v1.117 schema (sources_nasa / sources_crew / sources_payload / sources_w1_research_docs / sources_music_cross_track / sources_elc_cross_track / sources_sps_cross_track / sources_trs_cross_track)
- `research.html` — Track 1a Deep Research (~4,632 words)
- `papers.html` — Track 1b Wall-Clock Papers (~2,388 words)
- `organism.html` — Track 2 Paired Organism deep-dive on Marbled Murrelet (~3,087 words)
- `mathematics.html` — Track 3 Mathematical Threads (~2,452 words)
- `curriculum.html` — Track 4 College of Knowledge teaching unit (~2,584 words)
- `simulation.html` — Track 5 Creative Artifacts + Simulations Catalog (~2,037 words)
- `forest-module/NOT_APPLICABLE.md` — v1.131 inline-rationale pattern (Shuttle-payload mission has no plausible Forest Sim contribution)
- `retrospective/lessons-carryover.json` — full schema with lessons_inherited from v1.117 + lessons_contributed at v1.118
- `retrospective/corpus-deltas.md` — ~500-word corpus-delta narrative

Plus this 5-file release-notes set:

- `docs/release-notes/v1.49.716/README.md` (this file)
- `docs/release-notes/v1.49.716/chapter/00-summary.md`
- `docs/release-notes/v1.49.716/chapter/03-retrospective.md`
- `docs/release-notes/v1.49.716/chapter/04-lessons.md`
- `docs/release-notes/v1.49.716/chapter/99-context.md`

## Decisions

**v1.56 gold-standard depth target rather than v1.117 latest-predecessor depth.** v1.56 Surveyor 3 totals ~19,500 words across the 8 HTML+MD files; v1.117 STS-51-C totals ~33,171 words across the same set. The decision was to target v1.56 depth for first-restoration rebuilds and let future re-passes deepen to v1.117 depth where mission substrate justifies it. Rationale: the goal of the campaign is to close the structural gap (no sibling files at all), not to match the maximum-historical-depth precedent on first pass. v1.118's actual output came in at 23,234 words, slightly over the v1.56 target and well under the v1.117 reference — the band the brief specified.

**Single sub-agent dispatch rather than split-dispatch for the 13-file deliverable set.** Per memory `feedback_sub-agent-token-ceiling-iterative-dispatch`, sub-agents cap at ~60-70 tool uses; the v1.118 dispatch came in at 36 tool uses (5 Read + 13 Write + scaffolding), well under the ceiling. Splitting into two dispatches would have doubled the orchestrator-context cost without operational benefit. Pattern validates the brief-template structure for future campaign rebuilds.

**Forest-module NOT_APPLICABLE inline pattern rather than synthesizing a Shuttle-payload Forest Sim contribution.** STS-51-D's payload set (telecommunications satellites + commercial pharmaceutical research + senate-oversight tour) has no plausible biological substrate matching the Forest Sim layer. The v1.131 NOT_APPLICABLE.md pattern provides a structured-rationale placeholder rather than forcing a contrived contribution.

## Surprises

**Sub-agent completed the rebuild in 36 tool uses with zero content-filter trips.** The brief's positive-framing discipline (improvised contingency-response operations; activation-lever inertness pending future activation; political-oversight-as-flown precedent) carried through the entire deliverable set without sub-agent escalation. Lesson #10406 candidate POSITIVE-FRAMING-DISPATCH-DISCIPLINE sustained obs#5 cumulative.

**Mission-essentials block in the brief plus reference-page paths plus deliverable table was sufficient prompt context.** No additional clarification dispatches or mid-dispatch corrections were needed. The brief template at `.planning/missions/v1-49-716-nasa-layout-restoration-campaign/brief-v1-118.md` (~1,200 words covering mission essentials + reference paths + 13-file deliverable table + authoring conventions + tone discipline) is the template for future campaign briefs.

## Lessons Learned

- **Campaign launch validates Lesson #10168 reuse.** The counter-cadence cleanup-mission cadence (registered at v1.49.585 with target reuse every ~30 forward milestones) is now reused for a second family at v1.49.716 — the gap from v1.49.585 to v1.49.716 is 131 forward milestones, comfortably past the ~30-milestone reuse threshold. The pattern composes: v1.49.585 closed prose-only safety rules into deterministic gates; v1.49.716 closes per-mission content gaps into rebuilt deliverables.
- **The structural-gate-vs-semantic-content gap is the right frame for counter-cadence rebuilds.** The v1.49.715 canonical-layout gate now passes 169/169 structurally, but ~14 missions retain semantic gaps (missing sibling files, substrate-era track-content semantics). The campaign closes the semantic gap one mission per counter-cadence ship, separable from the structural-gate guarantee.
- **Brief-template reuse will validate the per-mission rebuild pattern across substrate-form-distinct missions.** v1.118 is a Shuttle-payload mission; future hard-bucket missions span Mars rovers (v1.163 Psyche), flagship outer-planet missions (v1.164 Europa Clipper), and solar observatories (v1.165–v1.168). The brief template should generalize across substrate-form-distinct missions with mission-essentials-block adaptation.

---

**Prev:** [v1.49.715](../v1.49.715/README.md) · **Next:** v1.49.717+

**Substrate anchors NEW LOCKED at v716 (0):** counter-cadence milestone; no NASA / MUS / ELC / SPS forward-cadence anchors registered.

**Substrate-cumulative observations at v716 (0):** counter-cadence milestone; engine-state threads unchanged.

**Mission rebuilt at v716 (1):** v1.118 STS-51-D Discovery — first restoration in NASA Canonical Sibling Files Restoration Campaign.
