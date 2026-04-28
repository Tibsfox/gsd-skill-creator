# Retrospective — v1.49.570

## What Worked

- **Half B selection deferral worked cleanly.** Opening the milestone with Half B as a placeholder pool of 8 candidates and finalizing the selection post-Half-A via CONV-09 gap-closure resulted in a better-motivated module list than pre-committing at open time would have produced. This scoping pattern should be formalized.

- **CAPCOM gate mechanical validation caught real issues.** The new mapping-coverage check (added for this milestone) verified that every GSD-component row carries ≥1 Tier-S/A resolved paper — a discipline that prevents the Quick-Reference Mapping Table from rotting as sources change. Numeric-attribution violations were caught at W1A/W1C/W2 in every wave and fixed before publication.

- **Over-delivery was cost-free.** Test count exceeded target by 2.2× without sacrificing quality. The pattern of "ship comprehensive test coverage for each module's behavior matrix" produced reliable modules that composed cleanly when the full test suite ran at phase boundaries.

- **LaTeX citation discipline mechanically enforced.** The 50-char citation window in capcom-gate.mjs forced inline `\citeconv{...}` placement next to every numeric claim — tighter attribution than the drift milestone achieved at its equivalent phase.

- **Five-paper convergence is the architecturally interesting finding.** Not the gap-closure candidates themselves — many of those were on the v1.50 wishlist anyway — but the scale of convergence between `gsd-skill-creator` and April 2026 arXiv literature. Five distinct research groups independently arrived at the same architectural patterns; design intuitions the project had operated on in isolation are mapping onto a real architectural frontier.

## What Could Be Better

- **Paragraph-level citation window was sometimes awkward.** Numeric claims like "5 to 20x for episodic memory" needed the cite placed immediately after `20x` to fit the 50-char window, which occasionally pushed sentence flow. A future refinement: accept `\citeconv` anywhere in the sentence if the sentence ends with `\citeconv`, relaxing the mid-sentence requirement while preserving end-of-sentence attribution.

- **Template-literal backtick escaping in TypeScript tests tripped initial capcom-gate test authoring.** The LaTeX double-backtick quote convention collided with JS template-literal syntax. Caught and fixed quickly, but the test file now uses single-quoted strings + array join to avoid the collision. Document this in the next milestone's test-authoring note.

- **One typecheck-error-in-unused-helper slipped in at Phase 713.** A broken generic-type helper (`defaultThresholds` in compression-spectrum/spectrum.ts) passed unit tests but failed `tsc --noEmit`. Caught at phase-boundary typecheck and removed. Lesson: run typecheck, not just tests, before claiming a phase complete.

- **Grove re-ingest of the milestone is an open item.** The `tools/rehydrate-seattle-360.ts` pattern from the 360 engine ("Grove update per release — run rehydrate after each degree") should have an equivalent for convergent-substrate college concepts. Not shipped this milestone; noted for follow-on.

## Lessons Learned

# v1.49.570 Convergent Substrate — Milestone Retrospective

**Status:** ready_for_review — pending human verification + merge-to-main gate.
**Branch:** dev (no push to main per 2026-04-22 user directive; human review required before merge).
**Opened:** 2026-04-23 via user request to load `~/Downloads/files(19).zip` as the next milestone's source deep-dive; scoping + STATE.md + REQUIREMENTS.md set up in the opening session.
**Closed:** 2026-04-23 (this retrospective; same-day milestone cycle matching the drift pattern).
**Phases:** 701, 701.1, 702–708 (Half A), 711–715 (Half B), 720 (closeout) — 14 phases.
**Prior release on dev:** v1.49.569 Drift in LLM Systems (`da614a3ff` — also `ready_for_review`; both milestones stacked on dev pending one combined human review cycle).
**Milestone tip:** `<pending>` — the final commit that adds this file + README + milestone-package.
