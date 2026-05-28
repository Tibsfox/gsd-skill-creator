# v1.49.847 — Retrospective

**Wall-clock:** ~60-75 min from session pickup (v846 close handoff read) to release-notes draft complete. Upper end of the codify-ship range, as expected for a 5-lesson clear vs the typical 2-3. Per-lesson cost ~10-12 min — slightly under linear due to shared structural work (manifest update, CLAUDE.md render, 4 of 5 lessons sharing similar 5-section anatomy).

## What went as expected

- **The handoff identified all 5 codify-eligible patterns explicitly.** v846's `04-lessons.md` enumerated the 5 candidates + their instance counts + their proposed canonical-doc homes. Per-ship recon during v840-v846 had already pre-validated each candidate. No recon-time wasted re-discovering eligibility.
- **The v840 codify-ship template was directly applicable.** Same shape: extend existing discipline docs + extend disciplines.json key_lessons + render CLAUDE.md. No new domain, no new manifest entry. Mechanical execution, just at 5x the lesson count.
- **All 4 extended discipline docs already had homes.** #10438 + #10439 fit cleanly as new top-level sections in `docs/meta-cadence-discipline.md`. #10440 fits as a subsection under `docs/architecture-retrofit-patterns.md`'s existing "## Discipline patterns" block. #10441 fits as a new top-level section in `docs/security-chokepoints.md` after the existing #10433 section. #10442 fits before the Lesson reference list in `docs/failure-mode-contracts.md`. No restructuring of existing docs needed.
- **Render-claude-md passed cleanly.** All 5 new lesson IDs appear in the rendered Operative-disciplines section across 4 domain entries.

## What I noticed

- **Operator decision to promote all 5 was load-bearing.** The eligible backlog at v846 close had 5 candidates — historically high. The default "2-3 lessons per ship" rate would have required 2 codify ships (5 ÷ 2.5) to clear. The operator chose the single-larger-ship path. The ship completed in ~60-75 min vs ~45-60 min × 2 for split ships, so total wall-clock is comparable; the post-ship cognitive surface is smaller (one promotion event vs two to track).
- **All 5 promotions extend existing disciplines.** Zero new manifest domains. This is the cleanest possible codify-ship shape — the discipline-as-data system already has homes for everything. The contrast with v802 (which introduced 2 new domains) shows that the system is maturing: new patterns are increasingly refinements of existing patterns rather than genuinely new domains.
- **Two of the promotions (#10438 + #10439) extend the same discipline.** Meta-cadence picks up two new lessons in one ship — both touching the calibrate/verify axes. The pairing is structural, not incidental: the verify axis adds a fourth ship-shape; the CLI/auto-emit duality refines the calibrate axis's completeness criterion. Co-located codification produces a coherent doc rather than two siblings drifting separately.
- **The DI-executor lesson (#10441) sits as a sub-class of #10433.** Rather than a parallel pattern, it's a specific application of the internal-helper rule. Codifying it as a sub-class in the same canonical doc (security-chokepoints) preserves the parent rule's centrality while making the sub-shape discoverable. The 3-instance evidence threshold (v825 + v843 × 2) was enough; codifying at the 3rd instance (rather than 2nd per #10426) is correct because the v843 mesh-family double-instance produced the contrast that made the sub-class shape visible.
- **The ProcessContextDenied re-throw (#10442) was promoted at 2 instances.** Below the typical 3-instance threshold for refinements of an existing parent lesson. The v842 candidate doc explicitly recommended "wait for 3rd instance"; the operator's all-5 decision overrode that. The classification was clear (specific shape of #10427's load-bearing-fails-loudly rule, not a genuinely new pattern), so 2-instance promotion is defensible.

## What surprised me

- **The codify ship's recon was 90% pre-done at session pickup.** Per-ship recon during v840-v846 had already drafted candidate analyses inside each ship's `04-lessons.md`. The v847 codify ship just needed to pick + synthesize. Most of the wall-clock went into the canonical-doc writing (5 sections totaling ~600 lines of discipline-doc prose), not into deciding what to codify.
- **CLAUDE.md `<!-- AUTO:disciplines:* -->` markers handled the JSON change correctly for all 5 lessons.** The render pipeline reads disciplines.json + emits the disciplines section between the AUTO markers. New `#10438` / `#10439` / `#10440` / `#10441` / `#10442` entries land in the right domain blocks without manual touch-up. Source-of-truth discipline pays off.
- **Zero new manifest domains was a possible outcome but not guaranteed.** Going in, #10438 (verify axis) and #10439 (CLI/auto-emit duality) could plausibly have justified a new "Calibrate-axis completeness" domain or a "Substrate lifecycle" domain. Confining them to the existing Meta-cadence entry kept the manifest stable at 23 — the right choice given that Meta-cadence's existing trigger and summary cover both lessons cleanly.
- **The 5-lesson clear emptied the eligible backlog completely.** Post-v847, the eligible backlog is 0; the carried-forward observations are all 1-instance below-threshold candidates. This is the cleanest possible post-codify state — every 2-instance pattern has been promoted; the next codify ship will start from the next batch of 2nd-instance achievements (likely v853+ once the carried-forward 1-instance candidates accumulate companions).

## Risk that didn't materialize

- **No render-claude-md failure on pre-existing agent drift.** Pre-existing drift state inherits cleanly; the codify ship doesn't perturb it.
- **No discipline-coverage regression.** Adding 5 new lessons doesn't move the UNCODIFIED count (their first emission is this ship's own `04-lessons.md`; the scanner needs them to land in 2+ retrospectives to count). UNCODIFIED holds at 39 ≤ ceiling 41.
- **No source-code changes; no test impact.** v847 is a pure documentation + manifest ship. Build + test should remain at the v846 close state (34,786 PASS).
- **No structural conflict across the 5 promotions.** All 5 lessons sit in different sections of different docs (or different sub-sections of the same doc, in the case of #10438 + #10439). No cross-lesson editing conflicts; no shared text that needed careful synchronization.

## Carried forward (post-v847)

NEW this ship: 1 below-threshold observation.

- **Full-backlog-clear codify ship pattern** — 1 instance from this ship. When the eligible backlog has 5 candidates and the operator decides to promote all 5 in one ship — vs the typical 2-3 — the ship is larger but the post-ship cognitive surface is smaller (one promotion event to track vs two). Wait for 2nd instance to disambiguate from "this was just the right time" vs "a recurring shape under specific conditions."

Inherited from v846 close (all 5 promoted; UNCHANGED below-threshold observations carry forward):
- Fire-and-forget over awaited for observability writes (v846, 1 instance).
- Canonical-doc-decision ship pattern (v844, 1 instance).
- Recent-vs-baseline-recent comparison pattern (v841, 1 instance).
- Drift-check noise as scoring-system feedback loop (v841, 1 instance).
- Codify-ship-as-recon-consolidator pattern (v840, 1 instance).
- Deferral-by-classification-ambiguity (v840, 1 instance).
- Auto-run-on-import as bootstrap-time tax (v836, 1 instance).
- Polarity convention for inverted-mechanic thresholds (v837, 1 instance).
- Bidirectional enforcement completeness (v838 + v836, 1-2 instances; ambiguous; DEFERRED v840 — UNCHANGED v847).

## Process retrospective

- **Codify ships consolidate; they don't surface new ground.** v847 confirms the codify-ship template at 5x lesson count: identify candidates from accumulated per-ship retrospectives; promote in priority order; extend existing discipline docs; update manifest; render CLAUDE.md; ship. Wall-clock scales sub-linearly with lesson count because the manifest + render work is shared.
- **The "promote all eligible candidates" mode is rare but defensible.** Default cadence is 2-3 lessons per codify ship; v847's 5-lesson clear is an outlier. The defensibility hinges on: (a) all 5 candidates already had canonical-doc homes (no structural restructuring required); (b) the operator explicitly chose the larger scope; (c) zero new manifest domains kept the discipline-as-data system stable. Without all three preconditions, the 2-3 default would have been correct.
- **Honest deferral was NOT needed this ship.** v840 deferred 3 candidates (no canonical-doc home; classification ambiguity). v847 had no such ambiguities — all 5 candidates were either clean refinements of existing parent lessons or had explicit canonical-doc decisions from prior ships (#10438's home set at v844). The codify ship inherits the per-ship-retro work as effective pre-decisions.
- **Next session pickup remains NASA 1.179 strong-default** (65 consecutive ships at 1.178 after this ship — record-widest pressure margin by 1 again). The codify ship advances no NASA degree pressure but pays down 5 patterns of accumulated discipline debt. The pressure on NASA 1.179 is now the widest it's been.

## Verdict on scope

This ship invests in the **codify axis**. It is the 7th forward-cadence tick of codification since the codify-axis cadence reset at v840 (within the 7-10 ship floor of #10428). Per the meta-cadence discipline, the codify axis was overdue (5 eligible candidates accumulated, comfortably above the 5-candidate trigger). The next overdue axis is the verify axis: v843's mesh family becomes verify-overdue at ~v853 per the newly-codified #10438's trigger. The naming-the-axis-even-when-not-chosen discipline is preserved: v853+ scope discussions should NAME verify-axis as the proposed investment even if a different axis wins on operator priority.
