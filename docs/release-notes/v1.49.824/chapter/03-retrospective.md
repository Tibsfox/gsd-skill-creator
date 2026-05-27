# v1.49.824 — Retrospective

**Wall-clock:** ~25 min from chain-open to tag-push. First ship of the v824-826 chain (Codify → git/core batch → T1.3 Ship 3).

## What went as expected

- **Two lessons cleanly extended existing disciplines.** Neither #10433 nor #10434 needed a new discipline-domain entry. Both fit naturally as extensions to existing entries (Security chokepoints + KNOWN_UNWIRED). Manifest entry count stays at 22 — extensions, not domain growth.
- **The codify-ship pattern is mechanical at this point.** Codify ships now have a fixed shape: pick the strongest tentative observations at 2-instance threshold; extend the canonical doc; extend the manifest entry; regenerate CLAUDE.md. Took ~25 min wall-clock for 2 promotions (was ~30-40 min at v814 for 2 promotions with new domains).
- **JSON manifest + render tool stayed clean.** `python3 -c "import json; ..."` validation + `npm run render:claude-md` ran without issue. CLAUDE.md picked up both new lesson numbers in the right domain entries.

## What I noticed

- **The codify ship doesn't reduce UNCODIFIED count.** Adding lessons to the manifest increases "Lessons in manifest" (75 → 77) but doesn't reduce UNCODIFIED (still 39). UNCODIFIED is "referenced in release notes but NOT in manifest" — new lesson IDs are referenced AND in manifest, so they show as COVERED. The metric tracking is correct.

- **Extension-over-creation grows the manifest more slowly.** v814 added 2 new domain entries (manifest 20 → 22). v824 added 0 new domain entries (manifest 22 → 22). When a new lesson fits naturally under an existing domain, extension is strictly cheaper than introducing a new one. The trade-off: discoverability — operators looking for "internal-helper pattern" might not find it under "Security chokepoints" without a cross-reference in CLAUDE.md.

- **The #10426 2nd-instance threshold rule is well-calibrated.** Both promotions hit at exactly 2 instances. Neither felt premature; neither felt overdue. The rule is doing its job — flag at 2nd instance, codify if pattern is stable, defer if more cases needed to validate.

- **The discipline-coverage ceiling generalization (#10434) is the more interesting promotion.** It's a STRUCTURAL pattern (ratchet-ledger shape) rather than a tactical pattern (helper threading). Structural patterns enable bigger downstream wins because they apply to non-obvious future surfaces. The internal-helper pattern (#10433) is also good but is narrower in applicability — it's specifically for chokepoint wiring.

## What surprised me

- **#10434 was the higher-value promotion despite #10433 being more concrete.** Concrete patterns are easier to spot and codify; structural patterns are harder. Both fit the 2nd-instance threshold cleanly, but #10434 will apply to more future surfaces (any new cross-cutting invariant) than #10433 (chokepoint wiring specifically).

- **Codify ship structure has stabilized.** Three codify ships now (v784, v805/v810/v814 chain, v824) — all follow the same shape: 2 new lessons, manifest update, CLAUDE.md regen, no test churn. The structural maturity makes future codify ships predictable.

## Risk that didn't materialize

- The discipline-coverage gate at ceiling=41 (current 39 + buffer 2) could have BLOCKED if my edits accidentally introduced a new UNCODIFIED reference. They didn't — the codify ship REDUCES the lesson candidacy backlog without adding new release-note refs to uncodified IDs.

## Carried forward

- **#10433 is forward-tested at v825.** The git/core 3-file batch in v825 explicitly applies #10433's batch-chip-with-helper pattern. If the batch costs ~3 × 14 LOC (~42 LOC), the prediction holds. If it costs more, #10433 needs refinement.
- **#10434 has no immediate forward-test.** The next new cross-cutting invariant introduced may use the ratchet-ledger shape; that's the natural validation. Until then, the doc is the forward signal.
- **Cross-rootdir wire pattern (1 instance, v823) carried forward.** Will codify at 2nd instance per #10426.
- **Codification-ship pattern at 5 instances** — meta-pattern arguably already covered by #10428. Defer separate codification.
- **Chokepoint pattern at 4 instances** — already covered by #10414 + #10426 + the new Security chokepoints discipline. Defer separate codification.
