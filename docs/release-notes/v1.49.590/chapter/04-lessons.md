# v1.49.590 — Forward Lessons

Four forward lessons emitted (#10197 #10198 #10199 #10200).

## #10197 — Three-track-plus-TRS pattern soaked at 4 instances → "established cadence" upgrade

**Definition:** The three-track-plus-TRS milestone shape — Track 1 NASA forward + Track 2 operational-debt fold-in + Track 3 TRS pack-fetch + supporting MUS/ELC/SPS quartet — has now landed across 4 consecutive milestones (v1.49.587 / v1.49.588 / v1.49.589 / v1.49.590) with consistent wave-plan structure (W0 Track-2 inline → W1a NASA dossier Sonnet + W1b/c TRS pack-fetch Sonnet → G0 → W2 NASA solo + MUS+ELC parallel → W3 polish → W4 ship). The pattern is no longer experimental; it is the established forward-cadence shape.

**Evidence:**
- v1.49.587 first instance — Mariner 6/7 + 2 Track-2 fold-ins (SPICE renderer build + CI-on-dev pre-merge gate) + TRS Wave 0 (topic-map extract)
- v1.49.588 second instance — Apollo 5 LM-1 + Track-2 deferred-item (F/25 rubric + AC10/AC7 leak hardening) + TRS Wave 1a packs 01-04
- v1.49.589 third instance — Apollo 6 + 4 Track-2 fold-ins (#10187/#10188/#10189/#10190) + TRS Wave 1b (partial)
- v1.49.590 fourth instance (this) — Apollo 7 + 3 Track-2 fold-ins (#10194/#10195/#10196) + TRS Wave 1b retry + Wave 1c

**3-criterion soak rubric (all three met):**
1. **Pattern-stable across milestones** — wave plan structure identical across 4 milestones (W0/W1a/W1b/G0/W2/W3/W4)
2. **Cross-substrate transferable** — pattern absorbs different Track 2 content (test harness, CI gates, version-bump tools, FTP sync) and different TRS waves (Wave 0 extract, Wave 1a/b/c pack-fetch) without structural strain
3. **Token-budget predictable** — total milestone Sonnet tokens at ~250-350K consistently (W1a ~80K + W1b ~100-150K + W2 ~100-150K); ship duration 2-3 hours wall-clock predictable

**Forward action:** Upgrade documentation framing — at v1.49.591+, refer to "the established three-track-plus-TRS cadence" rather than "the three-track-plus-TRS pattern." Codify wave-plan template as `template-files/three-track-plus-TRS-cadence.md` for future milestones to reference. Consider whether the cadence should fork into specialized variants (e.g., "first-crewed-mission cadence" vs "uncrewed-precursor cadence" vs "lunar-landing cadence" for v1.75 Apollo 11).

**Cross-link:** This lesson elevates the methodology emerging from v1.49.587-590 into a first-class cadence; supersedes Lesson #10182 (originated three-track-plus-TRS as pattern) by promoting it to cadence.

## #10198 — Mid-mission temporal-coincidence as MUS structural primitive (joins same-day-anchor pattern)

**Definition:** When a MUS candidate album is released **within the temporal window of the corresponding NASA mission** (launch ± mission-duration days), the temporal coincidence functions as a load-bearing structural anchor in addition to the standard structural-pair analysis. The pattern is now soaked across 2 consecutive milestones (v1.49.589 same-day; v1.49.590 mid-mission).

**Evidence:**
- **v1.49.589 (Apollo 6 / Bookends)**: Bookends released 1968-04-03 (one day before Apollo 6 launch 1968-04-04). MLK assassination same calendar day as launch. The 24-hour temporal anchor was identified at G0 as a primary structural primitive, not just decorative.
- **v1.49.590 (Apollo 7 / Electric Ladyland)**: Electric Ladyland US released 1968-10-16 = day 5 of Apollo 7's 11-day mission (1968-10-11 to 1968-10-22). Mid-mission release means the album was *physically distributable* during the flight; first-as-sole-producer Hendrix work parallels first-crewed-Apollo Schirra work in real time.

**3-criterion test for MUS temporal-coincidence anchor:**
1. **Release date ∈ [launch − 7 days, splashdown + 7 days]** — narrow window forces strong coincidence
2. **Independent structural pair anchor exists** — temporal coincidence is *additive*, not a substitute for structural pairing (Bookends had partial-success-proceed concept-album pairing; Electric Ladyland has first-as-sole-producer + extended-form pairing)
3. **No artist-NASA causal coupling** — neither artist was aware of the mission timing during album production; the coincidence is structurally meaningful precisely because it's accidental

**Forward action:** Add temporal-coincidence as an explicit MUS selection criterion in W1a research-prompt template. When candidates pass the structural-pair test, prefer the candidate with closest release-date proximity to mission window. For v1.72 Apollo 8 (1968-12-21 launch / 1968-12-27 splashdown): the **Beatles** *White Album* (1968-11-22) is just outside the window but extremely close; *Beggars Banquet* (1968-12-06) is two weeks before launch. Both candidates merit temporal-coincidence consideration.

**Anti-pattern:** do NOT force temporal-coincidence when no natural candidate exists. Many missions will not have a release within ±7 days; structural-pair pairing remains primary criterion. Temporal-coincidence is the secondary tiebreaker.

## #10199 — W1 brief-error catch discipline is load-bearing for technical accuracy (BE-2 HIGH evidence)

**Definition:** The W1 brief-error catch discipline (Lesson #10178 + #10192) has demonstrated load-bearing value: at v1.49.590 W1a, a HIGH-severity error in the mission brief was caught and corrected before W2 build. Without the catch, the milestone would have shipped with a factually-wrong technical claim about AGC Block II IC technology. The discipline is no longer "nice-to-have G0 hygiene" — it is **critical-path technical-accuracy enforcement**.

**Evidence:** v1.49.590 W1a dossier §7 BE-2:
- Mission brief said: "AGC Block II flew Sylvania DTL replacing Block I Philco RTL"
- Actual: Both Block I + Block II AGC used **Fairchild Semiconductor RTL** family (μL 914 single-NOR-gate → μL 9915 dual-NOR-gate)
- Error mode: false manufacturer attribution (Sylvania, Philco) + false logic family (DTL); both Block I AGC IC contracts were Fairchild and Block II continued the Fairchild RTL lineage
- If shipped uncorrected: NASA + ELC chapters would have presented incorrect technology lineage; ELC Domain 12 framing would have rested on a false reproducibility claim (different manufacturers ≠ reproducible qualification approach)
- W1a research caught the error against multiple authoritative sources (Wikipedia AGC + eejournal.com + NASA SP-4205 + Hall Apollo Guidance Computer book references). G0 user accepted the correction; mission brief updated; W2 ELC built correctly.

**3-criterion test for "load-bearing brief-error catch":**
1. **Severity HIGH or above** — correction reverses (not refines) a factual claim
2. **Cross-chapter propagation** — uncorrected error would appear in ≥2 chapters (here: NASA chapter narrative + ELC chapter Domain framing)
3. **Cited primary sources** — correction is anchored on multiple authoritative independent sources, not just one

**Forward action:** Continue the W1 brief-error discipline at the 8-12 catch target. When a HIGH-severity catch lands, document the correction in mission-brief revision history (annotate the corrected paragraph with "*correction landed v1.X.YYY W1 BE-N HIGH*") so future readers see the audit trail. v1.49.590's BE-2 is documented in MISSION-BRIEF.md §2 + §3.

**Anti-pattern to avoid:** do NOT relax the discipline as the cadence becomes routine. The 4-milestone soak of three-track-plus-TRS makes the workflow predictable, but the brief-error discipline must remain active — every milestone authors a fresh dossier, and every milestone must independently catch errors. Routine ≠ rigorous.

**Cross-link:** Validates Lesson #10178 (brief-error catch discipline) at HIGH severity. Extends Lesson #10192 (Sonnet 13K-word target enables higher catch rates): at 12,033 words v1.49.590 caught 11 errors including 1 HIGH. Catch-rate scaling continues linear (5/v1.587 → 6/v1.588 → 10/v1.589 → 11/v1.590).

## #10200 — arXiv direct-API 429 fallback to WebSearch+WebFetch is the reliable TRS pack-fetch pattern

**Definition:** When dispatching TRS M0 pack-fetch agents at scale (3+ packs in sequence), the arXiv direct API (`export.arxiv.org/api/query`) reliably returns HTTP 429 (rate-limited) on bulk queries. The proven-good fallback pattern is **WebSearch for "arxiv <claim-keyword>" → WebFetch the specific arxiv abs page**. This succeeded in 100% of cases observed (3-of-3 packs in v1.49.590 Batch A + B). The discipline should be applied PROACTIVELY from the agent's first claim, not reactively after a 429.

**Evidence:**
- v1.49.590 Pack-05 (linear-algebra, 10 claims): "One claim has only 1 source... no rate-limit interruptions after the initial 429 on export.arxiv.org abs pages (switched to API endpoint successfully)"
- v1.49.590 Pack-06 (complex-analysis, 5 claims): "arXiv returned 429 on initial direct API calls; switched to WebSearch + WebFetch per-paper metadata pattern, which succeeded without issue"
- v1.49.590 Pack-07 (physics-constants, 20 claims): "arXiv direct API returned 429 on initial fetches; WebSearch fallback applied successfully per Batch A discipline. All 31 files verified on disk."
- v1.49.590 Wave 1c attempt (packs 09 + 10 parallel) hit Anthropic per-account quota at startup BEFORE arXiv 429 became the issue — different failure mode (Sonnet quota vs arXiv rate-limit). 4 deferred to v1.49.591.

**3-criterion test for TRS pack-fetch dispatch reliability:**
1. **arXiv direct API expected to fail** — assume 429 on bulk queries; build fallback into the prompt template proactively
2. **WebSearch+WebFetch is the durable path** — Anthropic web tools have separate rate-limit pools from arXiv, so the fallback decouples cleanly
3. **Anthropic Sonnet quota is the harder ceiling** — pack agents at ~38K each × 4 parallel = 152K aggregate which can hit the daily-quota wall; the arXiv 429 is recoverable, the Sonnet 429 is not (must wait for reset)

**Forward action:** Update `04-arxiv-search-protocol.md` to document the WebSearch+WebFetch fallback as the recommended primary path for pack-fetch agents in M0 Wave 1+. Update the TRS pack-agent prompt template to include the fallback paragraph upfront. Plan v1.49.591 Wave 1c retry with batches restricted to ≤2 concurrent + ≥10-min spacing (more conservative than #10191's 3-min) to give Sonnet quota more recovery headroom.

**Anti-pattern to avoid:** do NOT plan TRS pack-fetch dispatch around arXiv-direct-API as primary — arXiv-direct is so reliably-broken that any pipeline depending on it as the happy path will exhibit non-deterministic behavior. WebSearch+WebFetch is now the canonical TRS pack-fetch primary pattern.

**Cross-link:** Refines Lesson #10191 (W1 dispatch quota discipline): the discipline is correct but the TRS pack-fetch wave runs against TWO quotas (Anthropic Sonnet + arXiv direct API). The 429 on the upstream service is recoverable per-pack via WebSearch fallback; the 429 on the Anthropic side is not. v1.49.590 Wave 1c quota-failure is the second TRS wave to hit the Sonnet ceiling (after v1.49.589 Wave 1b initial), confirming this as a recurring constraint at the 4-parallel scale.
