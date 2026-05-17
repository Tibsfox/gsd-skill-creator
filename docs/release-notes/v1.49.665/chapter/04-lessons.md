# v1.49.665 — Lessons

## Lessons applied (load-bearing)

- **#10172** closure-verification + scope re-framing — marbled-murrelet double-count discovered + retracted with operator authorization before any sub-agent ran on bad scope
- **#10193** sub-agent dispatch token ceiling — all 4 dispatches under 50 tool uses (30, 31, 25, 25); commit-between-deliverables held
- **#10196** cluster-close forward-notes load-bearing — 19-pack deferral + manifest-validation rule + Lesson #10364 candidate all surface to cc-3 / cluster-close
- **#10215** parallel sub-agent dispatch — 3 in Wave 1 + 1 in Wave 2; interleaved commits handled cleanly via order-independent marker inventory
- **#10265** cross-track scaffold-then-fill — cc-2 = step 2 (content + marker removal)
- **#10266** granular bypass — sub-agents respected SC_SKIP_DEPTH_AUDIT_SPS/TRS env conventions

## Lessons emitted candidate (v1.49.665)

### Lesson #10364 candidate — duplicate-species-first-instance-detection gate needed in SPS catalog-card workflow

**Claim:** When a NASA-degree-advancing milestone selects an SPS species for cohort entry, the substrate-tracking framework needs an automated "species-already-in-cohort" pre-check. v661 release-notes claimed first-instance for marbled-murrelet at SPS #115, but the species was already at SPS #82 from v608 era (with substantive substrate-form anchoring: PAIRED-OLD-GROWTH-OBLIGATE-VINDICATION + cross-track NASA 1.85 Pioneer 11). Without a gate, this kind of duplicate-claim can ship; downstream tooling (cc-1 scaffolder in this case) treats the duplicate as a fresh deliverable to scaffold.

**Reproduction:** v1.49.665 cc-2 session open. Pre-dispatch inspection of marbled-murrelet/index.html caught the existing SPS #82 page. Operator authorized retraction; cc-1 stub artifacts deleted; manifest entry removed. No content corruption shipped, but the close call shows the missing gate.

**Resolution pattern:** Add a `tools/check-sps-cohort-uniqueness.mjs` gate that scans `www/.../SPS/<slug>/index.html` files for declared `sps_number` + matches against the prospective new entry. Wire into pre-tag-gate as a soak-mode WARN check first (per v1.49.594 cross-link soak pattern), promote to BLOCKER at next NASA degree-advance.

**Apply:** when codifying, link to cc-2 retrospective + marbled-murrelet retraction documentation. Likely cc-3 scope OR future counter-cadence.

### Lesson #10365 candidate — Speculative manifest hints have ~50% error rate when not release-notes-validated

**Claim:** Scaffold-manifest theme hints derived from speculation (without release-notes validation) carry significant error risk. v1.49.664 cc-1 manifest hinted at themes for pack-21 (measure theory), pack-22 (functional analysis), pack-33 (control theory), pack-36 (convex optimization), pack-37 (dynamical systems), pack-38 (functional analysis cohort-close) based on extrapolation from v657 mission brief's pack-39 destination candidates. v1.49.665 cc-2 conservative agent's release-notes validation found 3 of 6 hints (50%) were WRONG: pack-21 was actually topology, pack-22 was actually measure theory, pack-33 was actually mechanism design.

**Reproduction:** cc-1 manifest authored without grep against `docs/release-notes/v*.md` for pack-NN references. cc-2 sub-agent validated all 6 hints; 3 needed correction.

**Resolution pattern:** For scaffolding manifests that hint at metadata (theme, K_N, milestone_bound), validate hints against release-notes BEFORE committing the manifest. Either via a `validate-manifest-hints.mjs` script or by including "validate against release-notes" as a brief deliverable in mission packages that author scaffold manifests.

**Apply:** when authoring future scaffold manifests with metadata hints, run `grep -rln "pack-NN\|K_NN" docs/release-notes/` for each entry; mark `"pending validation"` for any hint not corroborated; never include speculative metadata in `theme:` / `k_n:` / `milestone_bound:` fields unless release-notes-grounded.

## Forward action items (FA-665-N)

### FA-665-1: 19 TRS packs (pack-14..20 + 23..32 + 34..35) still SCAFFOLD-PENDING
**Status:** OPEN-NEW at cc-2 close. Themes fully pending; needs per-pack release-notes research. Operator decides at cc-2 close whether to ship as cc-2b, fold into cc-3, or defer to a future cluster.

### FA-665-2: Lesson #10364 (duplicate-species first-instance gate) codification
**Status:** OPEN-NEW. cc-3 scope OR future counter-cadence. Discipline doc + gate tool needed.

### FA-665-3: Lesson #10365 (manifest-hint validation rule) codification
**Status:** OPEN-NEW. Add to MISSION-PACKAGE-DISCIPLINE.md or sibling. Lightweight: documentation + optional `validate-manifest-hints.mjs` helper.

### FA-665-4: scaffold-retract.mjs helper (low priority)
**Status:** OPEN-FORWARD. If wrong-scope scaffold cleanup happens >1× more in the cluster (marbled-murrelet retraction was the first instance), worth ~30 min to author. Until then, manual rm + manifest edit is fine.

### FA-665-5: cc-2 carry-forwards from cc-1
- FA-664-1 PARTIALLY-RESOLVED — 12 of 32 markers removed; 19 remain (TRS pack-14..20 + 23..32 + 34..35)
- FA-664-2 PARTIALLY-RESOLVED — theme assignment complete for 6 packs (pack-21/22/33/36/37/38 + pack-40..43)
- FA-664-3 INHERITED — TRS pack-01..04 + pack-39 deep-dive (still not in cluster scope)
- FA-664-4 INHERITED — Phase 4 depth-scoring promotion (still forward work)
- FA-664-5 INHERITED — FA-663-3 LEASAT-3 forward-shadow (now 22d residual; cluster-resume target)

## Lessons NOT triggered this milestone

- Most carry-forward NASA degree-advance lessons sustain (#10341 / #10345 / #10346 / #10347-#10360) — no NASA engine advance this milestone
- **#10169** gate-not-vigilance — cc-1's STATE.md fix has been operating cleanly since v1.49.664 T14; no new drift surfaced this milestone
- **#10170** meta-test at ship time — will fire again at cc-2 T14 (STATE.md milestone_name should advance from cc-1 prose to "cc-2: Staged-Deck Content Authoring (SPS + TRS)")
