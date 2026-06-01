# v1.49.943 — Retrospective

## What went right

- **The ship followed the predecessor's own forward plan exactly.** v1.49.942's retrospective named two open items: promote the defer-bias Set-boundary pattern (now 2 instances) and pin the `stale`/`startup_failure`/`in_progress` transparency "in *both* gates together (preserving symmetry)." This ship did both, together, rather than splitting them across two ships — because they are the same surface. The promotion records the discipline; the new tests are a fresh application of it. The discipline doc's reference implementation and the actual suites stay in lockstep.

- **The new tests use the discriminating shape, not the convenient one.** The earlier `skipped`-transparent tests used a `[green, X, green, green]` @ `n=3` streak-3 shape, which does NOT distinguish a GREEN member from a transparent one (both yield streak 3). The new named-transparency tests deliberately use the v942 `neutral` discriminator — `[green, X, green]` @ `n=3`, expecting `streak 2` + `ready false` + `broke null` — which reds if `X` drifts into GREEN (streak 3) *or* into BREAKING (`broke` set). The lesson text in both the manifest summary and the discipline doc calls out this exact subtlety so the next author does not reach for the weaker shape.

- **Mutation proof ran in all four directions before authoring the notes.** GREEN += `stale` reds the macOS test (and only it); BREAKING += `in_progress` reds it; GREEN += `startup_failure` reds the cargo test; BREAKING += `stale` reds it. Each gate source was restored with `git checkout --` after each mutation, and both suites were confirmed green post-revert. The committed working tree is genuinely test-only — the gates already classified these states as transparent; the ship guards that.

- **The promotion was scoped to exactly one lesson.** The carried-forward text in the manifest summary actually bundled *two* candidates: the Set-boundary pinning (now 2 instances) and "a staged-lane flip-readiness gate's counting model must match the lane's FAILURE MODE, not be copied from a sibling gate." Only the ripe one was promoted to #10464; the counting-model candidate stays carried-forward in the summary. Promoting both would have over-reached.

- **The discipline's own promote-on-second-instance rule was honored, including its restraint.** The npm-audit-fix-hygiene candidate (raise the manifest floor + align peers after `npm audit fix`) has one instance (v941) and v941's lessons chapter says to promote on a second. It was left unpromoted. The operator was offered the choice explicitly and chose to defer — the same discipline that *justifies* promoting #10464 (two instances) *forbids* promoting the npm one (one instance).

## What went well in process

- **A thin codify ship still went through the full ship discipline.** Code/test changes + manifest + discipline doc + CLAUDE.md re-render, the lesson referenced in this ship's `04-lessons.md` so discipline-coverage marks it COVERED, then the standard sequence: five chapters, STORY, bump, full 18-step pre-tag-gate, separate `chore(release)`, tag, dual-push with `ls-remote` verification, RH refresh/publish, STATE with `--counter-cadence`.

- **GH releases were caught up in the same session.** v1.49.941 and v1.49.942 had shipped but never had GitHub releases cut (only v940 did). Both were created from their committed READMEs (fed via stdin under the sandbox), with v942 marked Latest — independent of the codify ship, low-risk, done first.

- **The arc closed cleanly.** Counter-cadence #20 (v1.49.925) *created* `macos-flip-readiness.mjs`; the cargo flip track (v938 gate -> v939 load-bearing flip) *surfaced* the Set-boundary hole; #21 (v942) *mirrored* the cargo boundary tests onto macOS and flagged the promotion; #22 (this ship) *promotes* the lesson and *completes* the transparency symmetry. Four counter-cadence ships converged on one gate family.

## What to watch

- **The counting-model candidate is still carried-forward.** "A staged-lane flip-readiness gate's counting model must match the lane's FAILURE MODE, not be copied from a sibling gate" (cargo lane-stability vs macOS organic-churn) remains in the manifest summary as an un-promoted candidate. It is arguably already well-documented in the #10463 section; a future codify ship can decide whether it merits its own lesson ID or stays descriptive.

- **The npm-audit-fix-hygiene candidate awaits a second instance.** When the manifest-floor/peer-alignment situation recurs after an `npm audit fix`, that becomes the second instance and the promotion is then in-discipline. Until then it stays a carried-forward note in v941's lessons.

- **The two gates are now Set-boundary-symmetric — keep them that way.** Any future change to one gate's GREEN/BREAKING Set (or its boundary tests) should be mirrored to the sibling in the same ship, per the new "When this discipline kicks in" bullet, so the symmetry does not silently drift.
