# v1.49.666 — Lessons

## Lessons applied (load-bearing this milestone)

- **#10169** gate-not-vigilance — both Lesson #10364 (SPS cohort-uniqueness) and Lesson #10365 (manifest-hint validation) converted from prose-vigilance into deterministic gate + discipline doc respectively.
- **#10170** meta-test at ship time — cc-1's STATE.md fix advances milestone_name automatically post-ship; firing again at v666 T14.
- **#10172** closure-verification + scope-expansion re-framing — cluster-close verification: cc-3 closes all FA-663-N inheritance (FA-663-3 → FA-666-1 forward; FA-663-7 closed; FA-663-9 inherited as FA-666-4; FA-663-10 closed) + most FA-664-N + FA-665-N.
- **#10184** single-step dev → main FF — applied at T14 step 7 (`git update-ref refs/heads/main HEAD`).
- **#10193** sub-agent dispatch ~60-70 tool-use ceiling — 4 Phase-5 sub-agents at 22-38 tool uses + 1 Phase-2 research sub-agent at ~20 tool uses; all under ceiling with margin.
- **#10196** cluster-close forward-notes load-bearing — this section is the cluster-close forward-notes. See FA-666-N below.
- **#10197** STORY-gate post-bump-version — applied at T14 step 2.5 per `docs/T14-SHIP-SEQUENCE.md`.
- **#10215** parallel sub-agent dispatch — sequentially-dispatched for Phase 5 (shared manifest edit target); parallel pattern reserved for non-shared-resource dispatches.
- **#10220** apply-to-self at obs#2+ — Lesson #10365 codified Phase 4, then immediately applied to Phase 5 sub-agent dispatch (recursive). Now at obs#5+ cumulative.
- **#10265** cross-track scaffold-then-fill — cc-3 = step 2 cohort-close (19 packs finishing what cc-2 started).
- **#10266** granular bypass token — `sps-cohort-uniqueness` joins the pre-tag-gate bypass-token vocabulary.
- **#10348** short substrate-time-lag — sets up cluster-resume v667 STS-51-I HIGH-PROBABILITY-VALIDATION (28d residual at v666 close).
- **#10356** counter-cadence-cluster threshold response — cc-3 closes the cluster opened at cc-1 in response to the v660-v663 4-consecutive-same-calendar-day-degree-advance trigger.
- **#10364 (codified this milestone)** — SPS cohort-uniqueness gate at `tools/check-sps-cohort-uniqueness.mjs`; soak-mode WARN at pre-tag-gate step 14/14.
- **#10365 (codified this milestone)** — scaffold-manifest hint validation rule at `docs/scaffold-manifest-discipline.md`; immediately applied recursively to Phase 5 TRS sub-agent dispatch.

## Lessons emitted candidate (v1.49.666)

### Lesson #10366 candidate — Mission-brief historical-record assertions should be flagged "preliminary; verify" not stated as authoritative

**Claim:** When a mission brief asserts a historical-record fact (cohort assignment, mission-crew roster, ISO codes, date bindings), the assertion may itself be a precedent-inheritance error. The Phase 2 sub-agent brief asserted "Lind ∈ NASA Group 6 (1967) deferred-flyer cohort" — inheriting from v663's framing. Sub-agent grep-verified against NASA bios and corrected: Lind is NASA Group 5 (1966). Cost was 0 because the sub-agent caught it pre-author, but the **brief-author** error pattern is worth surfacing as a discipline rule.

**Reproduction:** v666 mission brief Phase 2 ("FA-663-10 retroactive cohort"). Brief asserted three retroactive members (Llewellyn, Allen, Lenoir) + three already-flown trio (Henize, England, **Lind**). Sub-agent verified all six against authoritative NASA bios. Llewellyn / Allen / Lenoir / Henize / England all correct. Lind: incorrect group assignment in brief.

**Resolution pattern:** Mission briefs that ASSERT historical-record bindings should explicitly mark them as "preliminary — sub-agent must verify against authoritative source" rather than passing them forward as authoritative. Sub-agent's grep-then-trust pass becomes the validation. This is the **mission-brief sibling of Lesson #10365** (scaffold-manifest hint validation) — same shape, different artifact.

**Apply:** When authoring mission briefs that include historical-record claims (substrate-tracking cohort assignments, mission crew, dates, agency codes), suffix each claim with "(preliminary; verify)" or place under a §"Claims to verify in sub-agent first step." This formalizes what the v666 Phase 2 sub-agent did organically.

### Lesson #10367 candidate — Sub-agent destination-directory ambiguity propagates protected-path bypass

**Claim:** When a mission brief specifies a destination directory ambiguously ("likely under X or substrate-tracking sibling"), the sub-agent may choose the path that requires the strongest override (here, `ALLOW_WWW_COMMIT=1`). The Phase 2 sub-agent brief said "Output: retroactive cohort awareness document at appropriate path (likely under `www/.../NASA/cohorts/` or substrate-tracking sibling)." Sub-agent chose `www/` + bypassed the protected-path gate. Recovery: relocate to `docs/` + commit-message-embedded convention note codifying the split.

**Reproduction:** v666 Phase 2 sub-agent committed reference documentation under gitignored `www/` using `ALLOW_WWW_COMMIT=1`. Relocated post-hoc at `c49f085d6`.

**Resolution pattern:** Mission briefs that specify destinations for sub-agent deliverables should be **unambiguous** about the destination path AND about whether the file is gitignored published-site content (www/ — empty-commit pattern) or tracked reference documentation (docs/ — ordinary commit). When in doubt: docs/ for reference documentation, www/ for published-site content.

**Apply:** Future mission briefs include an explicit "Destination + commit-pattern" section per deliverable:

```markdown
**Deliverable:** docs/<category>/<file>.md
**Commit pattern:** tracked / ordinary commit (not www/ empty-commit)
```

## Lessons NOT triggered this milestone

- **#10180** (skip-guard) — no skip scenarios this milestone
- **#10199 §1.4** (re-framing review at 4+ cluster threshold) — cluster size was 3 (cc-1+cc-2+cc-3) below threshold; not triggered
- **#10208** (npm-audit threshold) — no advisories
- **#10224** (W3 retry-with-same-prompt) — no W3 dispatch this milestone
- **#10341** DIRECT-AUTHOR-DEGREE-ADVANCE-CADENCE — not a degree advance; pattern N/A
- **#10345** within-class-family-pivot — no SPS advance
- **#10346** EDWARDS-MANDATORY-LANDING — N/A this milestone
- **#10350** CONSECUTIVE-DIRECT-AUTHOR-CLUSTER — N/A this milestone (counter-cadence not direct-author)

## Forward action items (FA-666-N) — cluster-close per Lesson #10196 (load-bearing)

### FA-666-1: cluster-resume target = v1.49.667 STS-51-I Discovery LEASAT-3 RESCUE-RECOVERY
**Status:** OPEN at cc-3 close. Primary cluster-resume target. Closes the v660 5-degree forward-shadow from LEASAT-3-STUCK-LEVER-POST-DEPLOY-PARTIAL-FAILURE obs#1. Crew: Engle CDR + Covey PLT + Van Hoften MS + Fisher MS + Lounge MS. Day-2 Leasat-3 rescue EVA: Van Hoften + Fisher direct-spacewalker engagement. Also 3-satellite deploy (ASC-1 + Aussat-1 + Syncom IV-4 PAM-D). DIRECT-SPACEWALKER-CONTACT-RESCUE substrate-form obs#1 first-instance distinct from STS-51-D improvised-EVA-rescue. HIGH-PROBABILITY-VALIDATION per Lesson #10348 short-substrate-time-lag (28d residual at v666 close).

### FA-666-2: TRS pack-01..04 + pack-39 deep-dive depth-deficit
**Status:** OPEN-INHERITED (FA-664-3 → FA-665-5 → FA-666-2). Pre-existing depth-deficit; NOT SCAFFOLD-PENDING. Suggest standalone forward milestone after the depth-scoring threshold work lands.

### FA-666-3: TRS depth-scoring promotion to BLOCKER mode
**Status:** OPEN-INHERITED (FA-664-4 → FA-665-5 → FA-666-3). Gold-standard thresholds need defining. `pre-tag-gate` `depth-audit-trs` bypass token wiring blocked until threshold work lands. Worth ~1-2hr authoring; suggest standalone forward milestone.

### FA-666-4: NORM-THAGARD-COSMONAUT-PRECURSOR-COHORT continuing
**Status:** OPEN-SHADOW-INHERITED (FA-663-9). ~9y 10m residual to STS-71 1995-06-27 Mir-18 FIRST-AMERICAN-ON-MIR Thagard 5th flight.

### FA-666-5: Lesson #10364 BLOCKER promotion
**Status:** OPEN-NEW at cc-3 close. After soak window closes at next NASA degree advance, promote `check-sps-cohort-uniqueness` from WARN to BLOCKER via `SC_PRE_TAG_GATE_REQUIRE=sps-cohort-uniqueness`. v667 STS-51-I would be a natural promotion trigger.

### FA-666-6: `validate-manifest-hints.mjs` helper tool (low priority)
**Status:** OPEN-FORWARD (FA-665-3 → FA-666-6). Manual grep validation is sufficient at current scaffold-manifest-authoring frequency. Reconsider if scaffold-manifest authoring becomes routine.

### FA-666-7: `scaffold-retract.mjs` helper (low priority)
**Status:** OPEN-FORWARD-INHERITED (FA-665-4 → FA-666-7). Only worth ~30 min authoring if a 2nd wrong-scope scaffold retraction event happens (marbled-murrelet retraction was the first instance).

### FA-666-8: pre-existing test failures in `update-catalog-indexes.test.mjs`
**Status:** OPEN-NEW at cc-3 close. Surfaced during Phase 1 + Phase 3 test runs: 6 pre-existing failures in `tools/__tests__/update-catalog-indexes.test.mjs` IC-613-1.4 "TRS audit extension" branch. Failures present BEFORE this milestone's code changes (confirmed via `git stash` test). Not blocking cc-3 ship but should be triaged as a near-term forward.

### FA-666-9: `--lint-prose` date-anomaly check
**Status:** OPEN-FORWARD-NEW at cc-3 close. Phase 2 sub-agent's output contained a date-substitution artifact ("announced 2026-08-04…1967-08-04"). Caught at review. A low-cost prose-lint pass over substrate-tracking docs could catch similar in future. Nice-to-have; defer.

## Cluster-close summary

3-milestone counter-cadence cluster opened at v663 close per Lesson #10356; closed at v666. All FA-663-N items resolved or inherited:

| Original FA | Resolution at v666 |
|---|---|
| FA-663-3 LEASAT-3 forward-shadow | → FA-666-1 cluster-resume target |
| FA-663-6 staged-deck deficit | RESOLVED at cc-1 + cc-2 + cc-3 (full cohort) |
| FA-663-7 international-PS schema | RESOLVED at cc-3 Phase 1 |
| FA-663-8 STS-51-I successor | → FA-666-1 cluster-resume target |
| FA-663-9 NORM-THAGARD-COSMONAUT | → FA-666-4 inherited |
| FA-663-10 NASA-Group-6 retroactive | RESOLVED at cc-3 Phase 2 |

cc-2's FA-665-N items resolved or inherited:

| FA-665-N | Resolution at v666 |
|---|---|
| FA-665-1 19 deferred TRS packs | RESOLVED at cc-3 Phase 5 (all 19 filled) |
| FA-665-2 Lesson #10364 codification | RESOLVED at cc-3 Phase 3 |
| FA-665-3 Lesson #10365 codification | RESOLVED at cc-3 Phase 4 |
| FA-665-4 scaffold-retract helper | → FA-666-7 inherited |
| FA-665-5 cc-2 carry-forwards | → FA-666-1..4 distributed |
| FA-665-6 (LEASAT-3 forward-shadow) | → FA-666-1 cluster-resume target |

**Cluster productivity:** 3 milestones, all same-calendar-day 2026-05-17. Net code/doc additions across cluster: 12 SPS species + 19 TRS packs filled (31 of 32 SCAFFOLD-PENDING markers closed; 1 retracted) + 2 lesson codifications + 2 new gate tools + 4 new discipline docs + 1 schema spec + 60 new tests. Engine state UNCHANGED throughout.
