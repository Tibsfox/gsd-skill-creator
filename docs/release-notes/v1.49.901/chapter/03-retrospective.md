# Retrospective — v1.49.901

## What Worked

**Small-ship codify discipline.** v901 absorbed exactly one 3-instance candidate. The ship took ~10 minutes from chip-pick to passing pre-tag-gate — compared to the v899 multi-promotion codify ship which took ~15 minutes. The single-promotion shape is a useful complement to the 3-4-promotion codify cycle: when one carry-forward candidate has accumulated enough evidence but no others have reached 3-instance, the single-ship absorption is the right granularity. Generalizable: don't wait for a full cluster — promote one at a time when the slot opens.

**Source evidence was already cataloged.** The 3 instances had been re-listed in 9 consecutive retrospectives (v874 → v886 → v889 → v890 → v892 → v893 → v894 → v896 → v899) with consistent citations. Authoring Template 6 took ~5 minutes because the evidence table was prewritten in retro form — just needed to be moved into the canonical doc. The retrospective discipline pays off when a candidate finally cycles to promotion: there's no "scavenge the codebase for instances" step.

**Template 6 fits the v899 template-table format.** The cf-closure-verification-templates.md pattern of "When this applies / Test pattern / Variants or catalog / Evidence table / Anti-patterns / Cross-references" composed cleanly. Each new template adds ~50-70 lines but the cross-template coherence makes the whole document scannable.

**No source changes — no test breakage risk.** Pre-tag-gate vitest step ran the full suite (35,500+ tests) but v901 is doc-only + disciplines.json + auto-regenerated CLAUDE.md. No source-code change means the test surface is unmoved.

**Cross-references to #10456 / #10442 / #10427 strengthen the discipline cluster.** Template 6's "When fake-fixture pairs with audit-record-count" reference creates a discoverable path from Template 5 → Template 6. The discipline doc graph is denser after this ship; future authors who land on Template 5 will see the Template 6 cross-reference and read both.

## What Could Be Better

**The 27-retrospective delay was sub-optimal.** The fake-fixture pattern reached 3-instance at v874 and was re-cataloged in 9 retros across ~27 ships before codification. The v886 retrospective explicitly named the blocker: "cross-cutting test-discipline observation; belongs in `docs/test-discipline/` (which doesn't yet anchor a `disciplines.json` entry of its own — promotion may require establishing the entry first)." But by v901 (this ship), the disciplines.json entry for "Test authoring" was already established at v899 with #10456's addition. The promotion-blocker dissolved at v899 but the codify slot wasn't picked until v901. The lesson: when a codify-blocker dissolves (e.g., the parent discipline gets established), explicitly re-evaluate the carry-forward candidates that were blocked.

**No new instances were generated during the wait.** A 4th instance (e.g., a future `fake.pdf` chip) would have strengthened the template's evidence. v901 promoted with 3 instances; the codify-cycle convention is exactly 3-instance, so this is not a deficit, but the 27-ship delay was wasted opportunity.

**Counter-cadence count increment vs degree-advance tension.** v901 is counter-cadence #10 (was #9 at session start). The NASA degree pressure-margin record continues to grow (119 consecutive ships at 1.178). After v901 + v900, the session is 50% counter-cadence (v901 is CC, v900 is not). The next session should bias toward NASA degree-advance to rebalance — the v901 handoff will recommend NASA 1.179 as default forward-path.

## Lessons Learned

(see `04-lessons.md` for the per-lesson detail)
