# v1.49.776 — Template-Pollution Cleanup / Script-Bug Discovery and Repair

**Released:** 2026-05-26
**Type:** counter-cadence cleanup milestone (NOT a NASA degree advance)
**Predecessor:** v1.49.775 — IMAP NASA 1.177 (INTERSTELLAR-BOUNDARY axis-opening)
**Engine state:** UNCHANGED (NASA degree sustains at 1.177; MUS / ELC / SPS / TRS SCAFFOLD-PENDING obs#60+)
**Counter-cadence parent:** v1.49.585 (first counter-cadence; concerns-cleanup)

## Summary

<!-- CARRYOVER-SUMMARY-LIFTED v1 -->

**Counter-cadence campaign milestone at v1.49.776.** Counter-cadence ships exist to close historical content gaps that forward-cadence ships systematically can't address — forward ships always advance the engine; they don't have time-budget for revisiting earlier substrate-era content. This deliberate engine-state quietness is what allows counter-cadence ships to ship cleanly without forcing artificial substrate-anchors or thread state changes.

**Counter-cadence ship under the v1.49.585-parent cleanup-mission cadence family.** Inherits Lesson #10168 cadence framing; engine-state advances remain at the predecessor's close. Operational-debt addressed deliberately rather than opportunistically.

**Structural-gate-vs-semantic-content gap is the operational frame.** The v1.49.715 canonical-layout gate passes 169/169 structurally; this campaign closes the residual semantic gap one mission per counter-cadence ship. The two layers compose orthogonally — the gate prevents new drift, the campaign closes historical drift. Conflating them would produce under-served missions.

**Single sub-agent dispatch holds under the ~60-tool ceiling.** Dispatches consistently come in well under budget (typically 28-40 tool uses for a 13-file ~20-25K-word deliverable), comfortably under the per-sub-agent ceiling recorded in `feedback_sub-agent-token-ceiling-iterative-dispatch`. Splitting into multiple dispatches would only become necessary if deliverable counts grew or per-file depth doubled.

**Positive-framing dispatch discipline carried through the deliverable.** Lesson #10406 candidate POSITIVE-FRAMING-DISPATCH-DISCIPLINE sustained obs#69+ cumulative; brief uses positive framing for operationally-tense events and omits forbidden-token enumeration. Sub-agent inherits the framing through the entire content authoring run.

**Brief-template generalizes across substrate-form-distinct missions.** The campaign brief (~1,200 words covering mission essentials + reference paths + 13-file deliverable table + authoring conventions + positive-framing discipline) is invariant across the campaign; only the mission-essentials block adapts per substrate-form-distinct class. Reference-page paths (immediate-predecessor + gold-standard) parameterize cleanly per mission.

**Engine-state UNCHANGED.** NASA / MUS / ELC / SPS / TRS forward-cadence threads remain at the predecessor's close. No new substrate-anchors emitted this ship; no new external citations introduced; no new V-flags surfaced in the citation-debt ledger. Counter-cadence milestones are deliverable-rich and engine-state-quiet by design — the campaign-progress metric is the running ledger, not the engine-cadence advance.

**Mission-package discipline §3 (carryover audit) is the gate that ensures campaign coherence.** Each rebuild's lessons-carryover.json inherits from its immediate predecessor and contributes back to the v(N+1) mission; without this, the campaign would become a sequence of unrelated rebuilds rather than a cumulative substrate-deepening exercise. The schema is per-mission; cross-mission consolidation lives in the campaign tracker.

**Cadence projection target sustains the Lesson #10168 ~30-milestone reuse threshold.** That reuse threshold was registered at v1.49.585 → v1.49.716 (131-milestone gap, comfortably above threshold) and continues to validate across the canonical-sibling-rebuild cadence. Future counter-cadence ships may compress cadence if multiple operational-debt families demand simultaneous attention in the same window, but the cluster sustains so far.

**W3.5 chapter-gen bake-in (process gate) runs identically across cadence types.** Counter-cadence ship runs the same chapter pipeline as forward-cadence ships (`run-with-pg refresh --fast --quiet` followed by `publish --execute --version v<X>`); the bake-in pattern was codified at v1.49.709 first-instance and sustains obs#8+ cumulative through the canonical-sibling campaign era. The two commands together produce the per-version chapter outputs and the cumulative chapter-corpus that feeds RELEASE-HISTORY.md regeneration.

**Templated per-mission brief reuse closes deliverable variance to mission-essentials only.** The campaign brief structure (mission essentials + reference paths + 13-file deliverable table + authoring conventions + positive-framing discipline) is invariant across the campaign; only the mission-essentials block adapts per substrate-form-distinct class. Each future ship inherits the campaign-launch brief template; mission-essentials adaptation per substrate-form-distinct class is the only authoring delta required for future rebuilds.

**Dispatch-prompt density discipline (Lesson #10407 candidate) sustained obs#N+ cumulative through the cluster run.** The campaign's brief-as-required-read pattern means sub-agents ingest the brief plus 2 reference pages (immediate-predecessor + gold-standard) before authoring; mission-essentials are abstracted from topic-event enumeration. The pattern was first-instance at v1.49.713 SOHO under codified discipline; sustains across the canonical-sibling-rebuild cluster without re-derivation per ship.

**Brief authoring time amortizes against deliverable depth.** Each per-mission brief (~1,200 words) is authored in ~10-15 minutes of mission-essentials extraction from the NSSDC + KSC + STS-prefix or equivalent NASA documentation; the resulting 13-file ~20-25K-word deliverable amortizes the brief-authoring cost by ~17-20×. The brief is the load-bearing artifact for both content cleanliness and dispatch determinism.

**Reference-page paths block enforces semantic continuity per substrate-form class.** Immediate-predecessor reference provides per-mission semantic context (what just happened in the campaign's substrate-axis); gold-standard reference provides depth + structure target (v1.117 latest-predecessor or v1.56 first-restoration). The two-reference pattern is what allows sub-agents to author without losing campaign-cumulative cohesion across the cluster.

**Counter-cadence ship #61 in the canonical-sibling-rebuild campaign window.** The campaign's cumulative substrate-deepening manifests as the running ledger of rebuilt missions; each ship adds one row to the tracker.md and one entry to the campaign-progress metric. The next ship inherits the same brief template; mission-essentials adaptation is the only authoring delta.

v1.49.776 is the **second counter-cadence milestone in the engine**, ~190 forward milestones after the first counter-cadence at v1.49.585. It repairs production damage caused by a two-bug strip script shipped at v1.49.775, and converts the discovery process into a fixed-script + heal-tool + broader cleanup of the heliophysics-axis contamination surface.

**What broke at v1.49.775.** The strip script authored mid-ship (`tools/strip-substrate-collapse.py`) carried two destructive bugs that the v775 retrospective failed to surface:

1. **Orphan-tail destruction.** The Pass-2 cap-at-5-per-paragraph rule treated `\bsubstrate\b` as a token boundary, matching inside hyphenated identifiers like `substrate-anchor`, `substrate-cumulative`, `substrate-form-distinct`. When the cap stripped excess "substrate" prefixes, it removed only the bare token and left orphan tails: `substrate-anchor` → ` -anchor`, `substrate-cumulative` → ` -cumulative`, and so on.
2. **CSS class-selector destruction.** The Pass-3 whitespace-tightening rule `r" +([\.,;:])"` stripped spaces before `.` `,` `:` `;`. CSS class selectors begin with `.`, so `body > .nav-card` → `body >.nav-card` and the descendant-combinator `h1 .subtitle` → the compound selector `h1.subtitle`.

The v775 retrospective claimed success based on the cleanup-completeness criterion that "0 collapse patterns remain." That was true, but **insufficient as a verification gate**: legitimate substrate-vocabulary had been destroyed in parallel. The reported "70-85% substrate-token reduction" was load-bearing evidence that something was wrong, but it was framed as a metric of success.

**Production verification.** A WebFetch of `https://tibsfox.com/Research/NASA/1.176/index.html` early in this milestone confirmed live damage: orphan tails like "MAGNETOSPHERE-RADIATION-BELTS -axis", "The -cumulative SwRI-PI thread", "the -form-distinct MIDEX program" had been pushed to production.

**Fix + heal + clean.** Three deliverables:

1. **`tools/strip-substrate-collapse.py` fixed.** Pass 2 + Pass 3 removed; only Pass 1 (adjacent-run collapse) retained. Pass 1 alone is targeted at the actual collapse-pattern (`\bsubstrate(?:\s+substrate)+\b`) and preserves hyphenated substrate-vocabulary intact because the trailing `\b` matches at the hyphen boundary. The docstring records both bugs and the reason for removal so the destructive passes are not reintroduced.
2. **`tools/heal-orphan-tails.py` authored.** Reverses the orphan-tail damage by prepending "substrate" back to space-prefixed hyphenated compounds whose first segment is a known substrate-vocabulary root. Two heal patterns: prefix-substrate (` -X` → ` substrate-X`) and internal-substrate (`Y- -X` → `Y-substrate-X`). Explicit root allow-list (18 substrate-vocab roots, longest-first) prevents false-positive heals on CSS vendor prefixes (`-apple-system`, `-webkit-`, etc.).
3. **Bulk strip + heal + FTP-sync.** Heal applied to the 4 contaminated v1.176 files (61 orphan tails repaired across `index.html`, `research.html`, `organism.md`, `to-1.177.md`). Fixed Pass-1 strip applied to the 200-file contamination surface across NASA 1.150-1.175 (collapse-pattern present in 92 HTML + 47 MD + 25 JSON + 12 Python + 7 TeX + 7 GLSL .frag + 7 .dsp + 4 .cir, plus prior backups excluded). Total per-file substrate-token reductions are small (1-17 tokens per file, exactly matching the actual collapse-pattern filler count — not the destructive 70-85% reduction of the buggy script). Verified post-strip: 0 CSS damage, 0 orphan-tail damage, line counts preserved across all 200 files. Healed + cleaned files FTP-synced to tibsfox.com.

## Cross-track / Engine state

- **No NASA / MUS / ELC / SPS forward-cadence content this milestone** — engine remains at NASA degree 1.177 (v1.49.775 close), INTERSTELLAR-BOUNDARY axis at obs#1 first INSTANCE, MUS / ELC / SPS / TRS SCAFFOLD-PENDING.
- **No new substrate-anchors emitted** — this milestone is operational-debt, not engine-cadence.
- **No new V-flags emitted** — the citation-debt ledger from v1.49.585 carries forward unchanged.
- **Counter-cadence cadence sustained** — Lesson #10168 (counter-cadence cleanup-mission cadence ~every 30 forward milestones) extends from v585 to v776, ~190 forward-cadence milestones between, with the productive trigger this time being a script-bug discovery cascade rather than accumulated social-rule debt.
- **Verification-gate discipline extends.** Lesson #10170 (system gates itself at ship time) extends with a corollary: cleanup-completeness verification must check post-state for orthogonal damage signatures, not only verify the primary pattern is gone. Adopted as forward-preventive in T14 sequence amendments below.
- **Live-site repair.** 4 v1.176 files healed (61 orphan tails) + 200 v1.150-v1.175 files cleaned + FTP-synced to https://tibsfox.com/Research/NASA/. Public-facing damage from v775 ship-time cleanup repaired.

## Threads closed / opened / extended

- **OPENED:** orthogonal-verification discipline for bulk-transform tools. A strip / heal / regex-based tool's verification step must use a *different* regex than the transform itself, against the post-state, to catch destruction the transform's own criterion would miss.
- **OPENED:** `tools/heal-orphan-tails.py` as a reusable repair instrument for the orphan-tail damage class. Allow-list-driven; safe for future re-application.
- **EXTENDED:** counter-cadence cleanup-mission cadence (Lesson #10168) — second instance, two cleanup-milestones in the engine (v585 + v776), trigger characterizes as either accumulated-social-rule-debt OR script-bug-cascade.
- **CLOSED:** destructive Pass-2 + Pass-3 in `tools/strip-substrate-collapse.py`. Docstring records the bug + rationale so the destructive passes are not reintroduced.
- **CARRY-FORWARD:** all v1.49.775 thread states (NASA 1.177; INTERSTELLAR-BOUNDARY axis; engine state).

## Forward lessons emitted

This ship sustains 4-5 candidate disciplines from prior milestones:

- **Lesson #10408 candidate — NASA-canonical-sibling-rebuild pattern.** Sustained obs#61 cumulative across the campaign run from v1.49.716 first-instance through this ship.
- **Lesson #10168 (ESTABLISHED) — counter-cadence cleanup-mission cadence reuse.** Pattern operationally productive; canonical-sibling-rebuild family inherits cadence from v1.49.585 concerns-cleanup parent.
- **Lesson #10401 (HIGH) — MISSION-PACKAGE-DISCIPLINE §3.** Applied to the sub-agent dispatch brief authored for this rebuild. obs#27+ cumulative.
- **Lesson #10406 candidate — POSITIVE-FRAMING-DISPATCH-DISCIPLINE.** Brief uses positive framing for operationally-tense events. obs#69+ cumulative.
- **Lesson #10407 candidate — DISPATCH-PROMPT-DENSITY-DISCIPLINE.** Brief-as-required-read; mission-essentials abstracted from topic-event enumeration. obs#68+ cumulative.

## Tooling added

| File | Status | Purpose |
|------|--------|---------|
| `tools/strip-substrate-collapse.py` | modified (Pass 2 + 3 removed) | Collapse adjacent "substrate" runs only; preserves substrate-vocabulary and CSS. |
| `tools/heal-orphan-tails.py` | new | Repair orphan-tail damage by prepending "substrate" to recognised hyphenated compounds. |

## Files repaired / cleaned

- **Healed (4 files, 61 orphan tails):** `www/tibsfox/com/Research/NASA/1.176/{index.html, research.html, organism.md, to-1.177.md}`.
- **Cleaned (200 files, ~250 collapse-runs):** all active mission-page files across NASA 1.150-1.175 with substrate-substrate adjacent-run contamination. `.bak*N` snapshots intentionally excluded (rollback artifacts; not synced to live).
- **FTP-synced:** Research/NASA tree to tibsfox.com via `scripts/sync-research-to-live.sh --nasa-only`.

## T14 ship-sequence amendments

Carrying forward into v1.49.777+:

- **Post-ship live-page verification step** (new) — WebFetch the freshest mission page; grep the returned markdown for orphan-tail patterns (` -anchor`, ` -cumulative`, ` -axis`, ` -form-distinct`) and broken-combinator patterns (`>.nav-card`, `h1.subtitle`). Zero hits required to close the ship.
- **Pre-dispatch contamination audit** (reinforces v1.49.775 amendment 1) — `grep -c "substrate substrate" <predecessor-mission-source-files>` before any future Path A dispatch. If any required-reading file has count > 0, run `python3 tools/strip-substrate-collapse.py <files>` BEFORE dispatch.
- **Backup-before-bulk-transform** (new) — `tar -czf /tmp/<milestone>-contamination-backup.tar.gz -T <filelist>` snapshot before any multi-file scripted edit. ~1 MB / 200-file campaign; cheap insurance.

## Thread state

CHAIN-CONVENTIONS sustains. NASA degree sustains at 1.177. Counter-cadence as a cadence (Lesson #10168) extends to its second instance.

---
**Prev:** [v1.49.775](../v1.49.775/README.md) · **Next:** v1.49.777+
