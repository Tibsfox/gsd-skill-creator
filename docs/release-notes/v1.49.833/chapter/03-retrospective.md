# v1.49.833 — Retrospective

**Wall-clock:** ~40 min from v832 close to v833 release-notes draft. Codify ship at v830-833 chain close.

## What went as expected

- **The 5-instance evidence base produced a sharp discipline doc.** Cross-rootdir wire has 5 instances across 2 contract families (`SkillActivationObserver` and `ConceptFallbackProvider`) and 4 ship shapes (declaration, framework, implementation, integration). The discipline doc distinguishes all 3 shapes cleanly with cross-references; a 2-instance codification couldn't have done that.
- **Existing discipline doc template transferred cleanly.** `docs/architecture-retrofit-patterns.md` was the closest structural template (also a multi-pattern codification with subordinate sections). v833's discipline doc follows the same shape: surface + trigger + why + N patterns with anti-patterns + when-it-applies + lesson coverage + carry-forward observations.
- **`tools/render-claude-md.mjs` automatically regenerated CLAUDE.md.** I added one entry to `tools/render-claude-md/disciplines.json`; `npm run render:claude-md` produced a CLAUDE.md with line 113-114 containing the new entry. The render script handles the format details (lesson refs in italics, summary bullet structure, doc cross-references) so codify ships only need to update the manifest.
- **Codify-axis cadence reset cleanly.** v824 was the last codify ship at 8 ships ago by v832; v833 closes the window before the 10-ship ceiling. The discipline of codifying patterns within 7-10 ships of first eligible accrual stays observable.

## What I noticed

- **CLAUDE.md is gitignored.** I needed to verify `git check-ignore CLAUDE.md` before assuming the diff would surface the new entry. CLAUDE.md is regenerated per-developer from `disciplines.json` (the source of truth); the discipline doc + manifest are what ship.
- **The carry-forward observations section is load-bearing.** v833 codifies one pattern but explicitly defers 3 others, naming them with instance counts. Without this section, the deferred patterns become hidden debt that future codify ships have to rediscover.
- **Scope discipline matters in codify ships.** I initially considered codifying ALL 4 eligible patterns. The cost-benefit math: a 4-pattern codification doc is necessarily shallower per-pattern; a 1-pattern codification doc is richer per-pattern. With 5 instances of cross-rootdir wire (vs 2-3 instances of the others), the cost-benefit shifts decisively toward focused codification.
- **The lesson ID #10435 was the next available.** Latest in manifest was #10434 (v824 codify ship). Sequential numbering keeps the lesson ledger ordered; gaps from skipped lessons would be confusing.

## What surprised me

- **The discipline-coverage tool reports UNCODIFIED unchanged after a new entry.** Even adding a new discipline domain with a new lesson, the UNCODIFIED count stayed at 39 — because cross-rootdir wire wasn't previously listed as an UNCODIFIED LESSON (it was carried as a tentative observation in the release-notes). UNCODIFIED counts lessons that appear in release-notes but aren't in the manifest; cross-rootdir wire was an observation, not a numbered lesson. Adding it to the manifest doesn't reduce UNCODIFIED because there was no prior corresponding entry.
- **The render script accepts a JSON-edit then writes the rendered markdown atomically.** No partial render states observed; either the full new entry appears in CLAUDE.md or the render fails. Good for codify ship safety.

## Risk that didn't materialize

- The discipline-coverage gate might have ratcheted UP after adding a new lesson — it didn't (UNCODIFIED unchanged at 39, ceiling 41, buffer 2 unchanged).
- The new manifest entry might have failed JSON validation — it didn't; the manifest is loaded via standard `JSON.parse`, and trailing-comma-free entries are accepted.
- The discipline-doc cross-references might have included a path that didn't exist — they all do (verified via the canonical_docs array's 6 paths matching real files).

## Carried forward

- **Cross-rootdir wire pattern**: NOW CODIFIED as Lesson #10435.
- **Substrate-consumer hook PAIR pattern** (2 instances: v830 + v832): explicit carry-forward in `docs/cross-rootdir-wire-discipline.md` § "Carried-forward observations". DEFERRED to next codify ship.
- **`onPredictions` substrate-consumer wire pattern** (2 instances: v810 + v826): same. DEFERRED.
- **#10433 LOC-band-by-callsite-count refinement** (3 instances: v825 + v827 + v828): same. DEFERRED. Note: extends an EXISTING discipline (`docs/security-chokepoints.md`) rather than introducing a new one.
- **Verification/integration-only ships** (2 instances: v829 + v832): same. DEFERRED. Note: candidate extension to `docs/meta-cadence-discipline.md` (verify-axis sibling to codify/consume/calibrate).
- The 1-instance subordinate observations (Pick<T,K> handles, fail-soft fallback, local-interface redeclaration) are now subsumed into the cross-rootdir-wire discipline as subordinate patterns. No separate carry-forward needed.

## Forward-test of existing lessons

| Lesson | Status |
|---|---|
| #10416 lightest wire | RESPECTED — codify ship is documentation-only; no src/ changes |
| #10426 second-instance threshold | EXERCISED — codification at 5 instances honors the threshold + extracts a richer pattern than 2 instances would |
| #10428 meta-cadence | codify-axis tick: RESET (was 8 ships ago, now 0 ships ago) |
| #10432 KNOWN_UNWIRED ledger | NOT EXERCISED — not a chokepoint chip |
| #10433 internal-helper | NOT EXERCISED — codify ship; #10433 LOC-band refinement DEFERRED to next codify ship |
| #10434 discipline coverage ratchet | RESPECTED — UNCODIFIED unchanged (cross-rootdir wire wasn't previously UNCODIFIED; was a tentative observation) |

## Cadence observation

This ship is the codify-axis tick at the end of a single-feature 3-ship arc (v830-832 Option C). The shape "framework → impl → integration → codify" may itself be a higher-order cadence pattern — when a substrate-feature is shipped over 3 contiguous ships, a codify ship at the +1 position captures the cluster of patterns the arc accrued. If this shape repeats in a future arc, it's worth codifying as a meta-cadence sub-pattern.

The v830-833 chain spans 4 ships at ~2h15m wall-clock — well within the v829 handoff's "~2.5-3.5 hours" estimate for the Option C arc alone. The codify-axis tick adds 40 min and gives the chain a clean close.
