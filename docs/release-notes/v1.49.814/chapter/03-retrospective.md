# v1.49.814 — Retrospective

**Wall-clock:** ~45 min from session-start to tag-push. Fifth and final ship of the v810-814 chain. Codification ship.

## What worked

**Two clear-evidence promotions emerged from the chain itself.** The v810-814 chain accidentally generated the case studies for both promoted lessons:
- v813's STATE.md drift closure became the load-bearing case study for #10431 (two-layer closure). Without v813, this lesson would have stayed tentative (only the v807 detector half existed).
- v812's first ProcessContext chip became the fourth well-separated instance of the KNOWN_UNWIRED allowlist pattern (after v806 introduction + v809 first egress chip + v811 batch egress chip). The pattern was already at 3 instances at chain-start; the chip ship pushed it to 4 → past the codification threshold.

The chain's mechanical chip ships generated the codification evidence as a side-effect of the chip work. Recon-first (#10412) at chain-start didn't predict this; the codify-axis ship just happened to land at the right cadence for these specific patterns.

**The 2-discipline scope was correctly sized.** Going in, I counted 16 tentative observations (8 carry-forward + 8 new from chain). Promotion-criteria application immediately reduced this to ~4 candidates, then ~2 with clear case studies. Resisted: promoting the "post-infrastructure chip cadence is ~2× faster" observation (needs more data points); promoting the "two-layer default-off contract" observation (1 instance, lesson would be premature); writing a meta-discipline on "how to promote tentative observations" (no second case study yet for the meta-pattern).

**The existing discipline-doc shape was a strong template.** The 20 existing `docs/*-discipline.md` files follow a consistent shape: Rule + Case study + When/How to apply + Anti-patterns + Cross-references + Forward observations. Mirroring this shape for the 2 new docs took ~5 min per doc to outline, ~10 min per doc to fill — substantially faster than designing the shape from scratch. The pattern-template is itself unstated codification (worth observing? maybe a future #10433 if a meta-pattern shows up).

**The manifest.json + CLAUDE.md regenerate pipeline worked first try.** The disciplines.json edit pattern (add 2 objects to the end of the array) is well-established. `npm run render:claude-md` regenerated CLAUDE.md without error. The regenerated file passes the auto-render drift check at pre-tag-gate step 7.

## What surprised

**The 8 "new from this chain" observations folded into existing manifest entries more than expected.** Going in, I planned to promote 2-4 new lessons. Reality: 2 promoted (#10431 + #10432); 1 instance-of-existing (instanceof check pattern → already covered by #10426); 5 below-threshold (1 instance each). The chain's tentative-observation generation rate was high (~1.5/ship) but the per-observation evidence accumulation was low (most stayed at 1 instance).

This suggests the carry-forward observation count is a noisy metric. A future codify-axis ship should track:
- **Carry-forward count** (currently 8)
- **Instance accumulation rate per observation** (currently ~0.5-1 per ship)
- **Time-to-promotion** (currently 5-10 ships average for the 2 promoted this ship)

These are not implemented; flagged for forward consideration.

**The v813 case study for #10431 was almost too perfect.** When the v807 ship explicitly noted "complete closure would require [a source eliminator at] the END of T14's reset step" and v813 shipped exactly that, the pattern's evidence was unambiguous. This may be selection bias: the v807 retrospective WROTE the framing that v813 then realized. A more rigorous test of the pattern would be: does a 2nd independent procedure-rooted drift class also need both layers? Future ships will test this; #10431 is provisional until at least one independent case (e.g., PROJECT.md drift) validates it.

**The KNOWN_UNWIRED ledger pattern at 4 instances was a clean call.** All 4 instances (v806 introduction + 3 chips) follow the same shape literally (the same Set<string> structure, the same per-ship release-notes convention, the same batch-cadence). No fence-sitting on whether to promote. The 4-instance threshold (slightly above #10426's 2nd-3rd instance) gave high confidence.

## What to watch

- **The 2 new disciplines may need cross-reference updates in existing manifest entries.** The "Security chokepoints" discipline (codified at v806) doesn't yet reference #10432 even though they're tightly coupled (KNOWN_UNWIRED is the chokepoint's grandfathering mechanism). Worth a future minor update to add the cross-reference. Out of scope this ship per #10416.

- **The codify-axis spacing is now: v805 → v814 = 9 ships.** Within the #10428 ~7-10-ship window. Next expected codify ship: v824-826. Continue per the alternation cadence.

- **The 2 promoted lessons leave 6 tentative observations carrying forward** (4 from the v807-809 carry-forward set: watch-loop tear-down race, chained-session architectural-tax, registry-abstraction cross-chain payoff, 6th-mode-flag refactor trigger; 2 from this chain: post-infrastructure chip cadence + audit-test KNOWN_UNWIRED unidirectional shape). Plus ~6-8 unmerged from this chain. The carry-forward set is stable.

- **The two-layer closure discipline applies to PROJECT.md drift next.** Flagged in v813's retrospective: PROJECT.md has the same procedure-rooted drift shape (operator hand-edits before each ship). A future ship could apply #10431 atomically. ~30 min ship.

## Verdict on scope

Codification closure landed at the smallest viable shape: 2 new canonical docs (~170 lines each) + 2 manifest entries + 1 CLAUDE.md regenerate + 5 release-notes files. Resisted: promoting all 8 tentative observations; writing a meta-discipline; refactoring the existing 20 disciplines.

The chain CLOSES at v814 with all 5 ships landed and 2 new lessons in the manifest. Total chain wall-clock: ~175 min for 5 ships of mixed type (substrate-consumer + batch chip + first chip + counter-cadence + codification). Per-ship average: ~35 min. Falls within the single-session bound for context preservation.

The chain's chosen menu (operator picked items 2-7 from the v807-809 handoff) produced a strong micro-cadence demonstration: 3 forward + 1 counter-cadence + 1 codify mirrors the #10430 5-1-1 alternation discipline exactly. This wasn't a planned alignment — the chain plan was operator-bounded; the cadence emerged. Validates the discipline's intent: the alternation is robust to chain-shape variation as long as the 3-class mix is preserved.

## Cumulative chain takeaways

- **5 ships in ~175 min** is a reasonable single-session-window pace
- **Recon-first paid off ~3× in this chain** (v810 caught name-drift, v812 caught ProcessOp kebab-case, v813 caught normalizer single-pass-idempotency assumption)
- **Cross-chokepoint pattern transfer is real and fast** (v812 inherited v809's shape in ~5 min of design work)
- **Tools that spawn their own validators** are a substantial-but-bounded pattern (v813's normalizer spawn, possibly future bumps' state-md-set-shipped spawn integration)
- **The KNOWN_UNWIRED ledger is a robust observability surface** for migration progress; complementary to adoption-trends (v808)
