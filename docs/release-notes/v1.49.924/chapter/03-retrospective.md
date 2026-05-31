# v1.49.924 — Retrospective

## What went well

- **The codification rode an empirically-settled finding, not a freshly-asserted one.** The load-bearing fact in #10463 (a `continue-on-error` matrix leg masks the run-level conclusion) was already verified on a real throwaway-branch GitHub Actions run during the v923 ship. Codifying a fact that was settled against ground truth — rather than against docs or reasoning — is exactly the #10427 (loud-vs-silent / verify-against-ground-truth) discipline the lesson cross-references.

- **The home-doc choice was made by realizability, not by the candidate's first label.** The v923 candidate named "ci-cd / static-analysis-tool-discipline." No `ci-cd` canonical doc exists, and spinning up a whole new discipline domain for one lesson would have bumped the domain count and committed to a thin doc. Codifying into the existing **Static-analysis tool authoring** domain — whose scope already names "drift checkers," which is precisely what `ci-matrix-parity.test.ts` is — kept the manifest at 24 domains and gave the lesson a real, coherent home via its enforcement mechanism.

- **The drift-guard pairing is part of the lesson, not an afterthought.** #10463 carries its own enforcement story (the parity test forces the load-bearing flip to update the test). That makes it a clean sibling of #10461 rather than a standalone CI tip, which is what justifies its place in a static-analysis (drift-guard) discipline.

## What was tricky

- **Lesson-ID assignment crossed a known namespace collision.** The `#104xx` operational-discipline IDs collide numerically with an unrelated auto-generated `#104xx` sequence in `.planning/roadmap/v1.49.445/04-lessons.md` (engine-content "investigate" lessons). The collision is pre-existing — `#10461`/`#10462` already mean different things in each space — so the next operational ID is simply `#10463` (verified free across `disciplines.json` + the discipline docs + release-notes operational lessons). Worth re-flagging because a naive "is #10463 used anywhere?" grep returns the roadmap hit and looks like a conflict.

- **Single-instance codification, recorded honestly.** Most disciplines here promote at a 2- or 3-instance bar. #10463 is a single-instance, operator-authorized codification — the empirical masking fact is the load-bearing evidence, not a pattern count. The doc and the manifest entry say so explicitly rather than implying a phantom three-instance history.

## Forward

- **Carry-forward #1 — the load-bearing flip — stays open by design.** It is deferred until N consecutive green macOS pushes accumulate across *organic* development churn (the green pushes from the v923 ship itself do not count as a diversity track record). When the flip happens, deleting `continue-on-error` from `ci.yml` MUST also update the `STAGED` assertions in `ci-matrix-parity.test.ts` — the guard makes that pairing mandatory.
- **The staging gotcha is unchanged.** This ship commits only the codification surface (`disciplines.json`, the home doc, the v924 notes); it does not sweep the long-standing RH/dashboard working-tree drift. Stage explicitly per file.
