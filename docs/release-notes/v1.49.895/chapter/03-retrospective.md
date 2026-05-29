# v1.49.895 — Retrospective

## What worked

**Three 2-or-3-instance candidates promoted cleanly in a single codify ship.** The v892-v895 session accumulated all three patterns organically: v891 + v893 (substrate-wrapper, 2 instances); v856 + v894 (substrate→calibration end-to-end test, 2 instances); v891 + v893 + v894 (setTimeout(50ms), 3 instances). Counter-cadence ships work best when the session has set up the evidence base — v895 was lower-effort than v886 (which had to synthesize evidence retroactively).

**Cross-references between the new lessons are load-bearing.** #10452 names #10451 as its sibling (read-side procedure vs write-side procedure). #10453 names #10452 + #10451 + #10454 as ingredients. #10454 names #10437 + #10453 as parent + consumer. The graph structure means a reader landing on any of the three immediately sees the others' relevance.

**Two sub-variants of substrate-wrapper documented at 2-instance.** Rather than waiting for a 3rd instance to discriminate default-fixed vs outcome-driven, v895 documents both sub-variants with the polarity-derivation discriminator. The 2-instance evidence (v891 default-fixed + v893 outcome-driven) is sufficient to surface the distinction; future 3rd-instance evidence will either confirm or refute the discriminator.

## What didn't work

**No new surprises in the codify itself.** Pure doc work; the patterns were well-rehearsed by the v892-v894 ships. The render-claude-md regeneration worked first try after disciplines.json edits.

**Mild: 1-instance carry-forward remains large (~12 candidates).** v895 absorbed the ESTABLISHED-ready ones; ~12 candidates remain at 1-instance. None promoted this ship, but the codify-axis backlog continues to grow at ~6-8 candidates per ~30-ship cycle. The next counter-cadence ship will need to either:
- Wait for more candidates to reach 2-instance, OR
- Promote some 1-instance candidates with explicit "monitor-for-2nd-instance" annotation.

## Verdict on scope

Closing ship of the v892-v895 multi-ship session. ~25 min wall-clock. Comparable to v886's codify-ship duration. Total session: 4 ships in ~85min (v892 ~15min chip + v893 ~25min substrate + v894 ~15min integration test + v895 ~30min codify including 3 doc extensions + disciplines.json update + CLAUDE.md regen).

The v887-v891 session shipped 5 ships in ~90min. v892-v895 ships 4 in ~85min. Average ~22min/ship (vs ~18min/ship for v887-v891 session). The codify ship costs slightly more than a forward chip but synthesizes session-internal observations — the marginal cost is justified by the discipline accumulation.

## Promotion-eligible candidates accumulated this ship

None new (codify ships consume rather than generate). Carry-forward 1-instance candidates remain unchanged from v894 lessons.

## Forward path

**Session-close.** v892-v895 session is complete. Next session resumes from one of:

- **NASA forward-cadence at 1.179** — pressure-margin record now at 113 consecutive ships at 1.178 (extended by 4 this session from the 109 baseline). Operator-recommended default.
- **Continue LoaderContext chip-down** — 11 entries remain in KNOWN_UNWIRED ledger.
- **Integration test for `token_budget.max_percent`** — verify-axis trigger within 10-ship budget (extends to v903). Mirrors v894 using #10453's canonical test shape.
- **More counter-cadence** — 12 carry-forward 1-instance candidates accumulating; another ~5-10 ships will surface 2-instance promotions.
