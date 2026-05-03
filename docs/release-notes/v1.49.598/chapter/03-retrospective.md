# v1.49.598 — Retrospective: Carryover Lessons Applied + New Observations

## Carryover lessons applied this milestone

### #10185 (32K output token cap silently truncates single Write on files >100 lines)

**Applied at:** all NASA 1.78 files >100 lines authored via incremental Edit operations (3-12 per file) per W2 build-agent template Tier 2 step (b). Single Write only used for new files <800 lines (artifact files, JSON, forest-module).

**Verification:** all files non-truncated; final byte counts within Tier 2 78-89% predecessor-depth ratio (NASA actually 99% lines / 115% bytes; MUS 91% lines / 87% bytes; ELC 100% lines / 80% bytes).

### #10199 (brief-error discipline target 8-12 errors per iconic mission)

**Applied at:** 10 brief errors catalogued in NASA 1.78 index.html Brief-Error Corrections card (Shepard age, Houston-we-have-a-problem misattribution, docking-attempt count, Big Bertha mass precision, golf-ball distances per 2021 USGA re-analysis, Antares jettison time, Cone Crater dimensions, Eyles patch authorship time, S-IVB-509 impact time, Tapestry release date).

**Verification:** 10 / 8-12 target — PASS.

### #10203 (NASA canonical sections must use exact regex names)

**Applied at:** all 7 NASA-canonical-section regex patterns matched in NASA 1.78 index.html (Three Parallel Threads, Resonance Axes, Founding-Instance Narrative, Forest Contribution, Governance and Chain Declarations, Data Files, Dedication).

**Lesson-applied refinement:** caught and fixed mid-build — initial pass used `Governance &amp; Chain Declarations` (HTML entity form) which fails the depth-audit regex `Governance(?:\s+&|\s+and)?\s+Chain\s+Declaration` because `&amp;` isn't a literal `&` after HTML decoding. Switched to alternative-spelling "Governance and Chain Declarations" (also accepted per template). The regex catches HTML-entity drift; the lesson-applied fix demonstrates the regex is the substrate's load-bearing gate, not the prose suggestion.

**Verification:** 7/7 canonical sections matched (Python re.search confirmed; depth-audit gate ≥5/7 PASS).

### #10213 (NASA artifacts/ directory canonical 13-file suite required)

**Applied at:** 13 artifact files authored across 5 categories (story HTML+tex; shaders frag+viewer; audio 2× dsp+html pairs; circuits cir+html+md; sims py+html). Every source artifact has companion runner-HTML for browser-interactive use.

**Verification:** 13 files / 5 categories present; depth-audit reports `13 artifacts 5/5 cat` PASS.

### #10221 (dev/main 0-commit drift via ship-sync — ESTABLISHED at v1.49.596 third-instance)

**Applied at:** W4 ship pipeline in this milestone uses `npm run ship-sync` after each main-merge per the canonical post-merge step. Standing rule maintained.

**Verification:** pending W4 execution at Phase 833.7 (post-main-merge step).

### #10222 (NASA index.html cross-link enumeration must reference all artifact files)

**Applied at:** NASA 1.78 index.html Creative Artifacts card has 11 cross-links + Runnable Simulations card has 4 cross-links + Forest Contribution card has 1 forest-module link + 4 coupling enumerations. Cross-link total: 16 references.

**Verification:** depth-audit reports `13/13 linked` (100% coverage); the cross-link gate PASS.

**Forward-action this milestone:** authored Playwright smoke test at `tests/intelligence/intelligence-html-smoke.spec.ts` to gate against the v597 manual-smoke gap. Closes the meta-action component of #10222.

### #10223 (Tier 2 main-context inline-Edit recovery procedure)

**Applied at:** Sonnet sub-agent dispatch unavailable in flight-ops' tool surface for v598; Tier 2 main-context Opus inline-Edit applied per W2 build-agent template lines 247-269. Skeleton-then-augment pattern used for files >100 lines. Per-file budget 3-7K output tokens enforced.

**Verification:** Tier 2 78-89% predecessor-depth ratio maintained or exceeded; NASA 1.78 at 99% lines / 115% bytes is the strongest Tier-2-as-primary build to date.

**Forward-action this milestone:** authored dashboard-generator non-empty test at `tests/dashboard/dashboard-generator-output.test.ts` to gate against the v597 manual-smoke gap. Closes the meta-action component of #10223.

### #10228 (ScheduleWakeup deferred resume tier-3 fallback)

**Applied at:** not triggered this milestone (Tier 2 sufficient throughout). Precedent maintained for future milestone if needed.

### #10231 (iconic-mission depth-recovery soak — observation point)

**Applied at:** Apollo 14 IS the iconic-mission test bed for the soak. Tier 2 Inline-Opus build at the strongest depth ratio observed to date (99% lines / 115% bytes vs immediate predecessor NASA 1.77).

**Verification:** observation #2 PASS LOCKED. Recorded in NASA 1.78 retrospective/corpus-deltas.md frontmatter as `soak_observation_10231` parseable key for future ship-pipeline retrospective-aggregator tools.

**Caveat (per lab-director Phase 831 close interpretation B):** depth-audit's compare-against-immediate-predecessor heuristic may inflate Tier 2 results when the immediate predecessor is also a Tier 2 build (e.g. v1.78 vs v1.77 at 99% lines / 115% bytes). See forward-lesson #10238 for the consider-gold-standard-comparison-extension proposal at v599+.

### #10232 (INSIDE-window MUS pick soak — observation point)

**Applied at:** *Tapestry* (1971-02-10) released INSIDE Apollo 14 mission window (Jan 31 — Feb 9). Second observation point after v1.49.596 *McCartney* (1970-04-17, INSIDE Apollo 13 window).

**Verification:** observation #2 PASS LOCKED. Both observations PASS without forcing pre-mission/post-mission stretch. Logged in MUS 1.78 organism.html cross-track section + NASA 1.78 retrospective frontmatter.

**Forward-look:** v1.49.599 Apollo 15 (Hadley-Apennine; Jul 26 – Aug 7 1971 window) INSIDE-window candidates are weak (Marvin Gaye *What's Going On* OUTSIDE by 2 months; Joni Mitchell *Blue* OUTSIDE by 5 weeks). v599 may need to defer to OUTSIDE-window for first time and observe whether the soak holds OR if INSIDE-window becomes mandatory once observed twice. Document the decision in v1.49.599 W1.MUS.

## §6.6 register state — final disposition for v598

The mission brief defaulted to "no Path-D admit for nominal Apollo 14." The W2 build evidence superseded that default — Apollo 14's structural-firsts density was substantially higher than the brief anticipated. **§6.6 register advances 21 → 23 at v1.49.598 G2 lock**:

1. **GEOM (GEOLOGICAL-MOBILITY) 1-exemplar origination via MET — ADMIT.** Pre-approved at lab-director midpoint #1 spot-check; canonical-criteria check passes all three; novelty-vs-Lunokhod-1 three-part resolution airtight. Founding instance: Apollo 14 Modular Equipment Transporter (MET) EVA-2 traverse 1971-02-06.

2. **PERSISTENT-PROGRAM-CYCLE (PPC) 1-exemplar origination via Moon Trees lineage — ADMIT.** Approved at lab-director Phase 831 close. Distinct from existing §6.6 threads (LM-AS-LIFEBOAT is single-instance equipment-rating-extension; GEOM is mission-execution mobility primitive; PINPOINT-LANDING / AUC / PREC are procedural primitives; PPC is artifact-lineage primitive). Founding instance: Apollo 14 Roosa PPK seed payload + 55-year lineage 1971-2026.

3. **PROCEDURAL-RECOVERY (PREC) — PROMOTE TO ESTABLISHED at 3-ex reproducibly-stable.** Approved at lab-director midpoint #1 spot-check. 3-ex evidence chain: Apollo 12 Aaron SCE-AUX (founding) + Apollo 13 multi-recovery + Apollo 14 Eyles abort-bit patch (3rd instance). Aaron retains founding-instance position per Apollo 12 retrofit-hint in NASA 1.78 corpus-deltas.md. Register count unchanged (promote, not admit).

**Combined register move: 21 → 23 at v1.49.598 close.** Net +2 (GEOM admit + PPC admit; PREC promote no-count-change).

## Mid-milestone process observations

### Trust-budget incidents handled transparently

Two trust-budget-burn incidents surfaced + were corrected during execution:

1. **Phase 829 SC1 — regex frontmatter validator missed YAML parse failure.** Used `re.search(rf'^{k}:'` to test field presence on pack-12-008-riehl frontmatter; missed unquoted-colon parse failure on `venue:` line. Lab-director caught; switched to `yaml.safe_load`. 16/16 PASS exit 0 confirmed.

2. **Phase 830 MUS — initial draft self-counted "≈ 3300 words" came in at 2722.** Below 3500 target. Extended via §6.5 Brill Building methodology + §6.6 Adler production methodology + §6.7 James Taylor co-context to 4108 final. Mid-draft self-counts unreliable; wc -w at section boundaries with exit code is the correct discipline.

**Both retrospectives logged + actioned:** all subsequent validation claims this milestone use proper parsers (yaml.safe_load, not regex) + wc -w with exit code (not estimation). Lab-director acknowledged the trust-restoration discipline at Phase 831 close.

### Spec-vs-implementation drift caught at first authoring

The dashboard-generator non-empty test (#10223) caught its first instance of "spec-vs-implementation drift" at authoring time: the ROADMAP spec said "≥1 phase-card" but the actual generator (src/dashboard/generator.ts line 331) uses `<div class="timeline-item ...">` for phase entries (no separate `phase-card` class exists anywhere in the codebase). Adapted the test to actual generator contract with inline comment explaining the spec-vs-reality reconciliation. **The test caught the drift before the drift could propagate** — exactly the kind of gate the test is meant to catch in subsequent maintenance.

### Cross-track substrate-coherence emerged, not constructed

The three-track canopy-substrate pair (Roosa PPK Douglas fir + redwood seeds → Moon Trees Douglas fir + redwood survivors → MAMU canopy nesting in same species) anchors three substrates on a single shared physical artifact. This pairing was not selected to fit a thematic frame; it appeared as the substrate's own emergent property when ELC + SPS picks were made. **Forward-lesson #10236 emitted: cross-track structural pairs are discovered, not constructed — substrate-vs-frame epistemology established at v598.**

## Forward observations + decisions for v599+

- **#10238 forward-look soak (depth-audit Tier-2-vs-Tier-2 inflation):** consider extending depth-audit to also compare against the most recent gold-standard predecessor (e.g. v1.78 vs v1.69 at ~80% lines / ~85% bytes expected) when the immediate predecessor is itself a Tier-2 build. Decision deferred to v599+ until Tier-1 vs Tier-2 baseline can be re-established via Sonnet sub-agent dispatch restoration.

- **#10233 forward-look soak (Tier 2 inline-Opus as primary build path):** v599-v601 may sustain Tier 2 as primary OR revert to Sonnet sub-agent dispatch if the tool gap is closed. v598 is the first observation; v601 is the earliest ESTABLISHED-promotion candidate at 3-ex.

- **MAMU population trajectory uncertain through 2050:** SPS #75 forward-look notes Pacific Coast Marbled Murrelet population declining ~3%/year; projected halving by ~2050. Conservation interventions (corvid management + marine prey base restoration + old-growth restoration accelerated rotation + cross-track NSO+MAMU recovery program collaboration) in development. Future SPS engine entries may revisit MAMU at multi-degree intervals.

- **MUS 1.79 INSIDE-window forward-look:** v1.49.599 (Apollo 15 window Jul 26 – Aug 7 1971) INSIDE-window candidates are weak. May need first OUTSIDE-window observation; document explicitly.
