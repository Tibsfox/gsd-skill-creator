# Lessons — v1.49.570

11 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Status:**
   ready_for_review — pending human verification + merge-to-main gate.
   _⚙ Status: `investigate` · lesson #9984_

2. **Branch:**
   dev (no push to main per 2026-04-22 user directive; human review required before merge).
   _⚙ Status: `investigate` · lesson #9985_

3. **Opened:**
   2026-04-23 via user request to load `~/Downloads/files(19).zip` as the next milestone's source deep-dive; scoping + STATE.md + REQUIREMENTS.md set up in the opening session.
   _⚙ Status: `investigate` · lesson #9986_

4. **Closed:**
   2026-04-23 (this retrospective; same-day milestone cycle matching the drift pattern).
   _⚙ Status: `investigate` · lesson #9987_

5. **Phases:**
   701, 701.1, 702–708 (Half A), 711–715 (Half B), 720 (closeout) — 14 phases.
   _⚙ Status: `investigate` · lesson #9988_

6. **Prior release on dev:**
   v1.49.569 Drift in LLM Systems (`da614a3ff` — also `ready_for_review`; both milestones stacked on dev pending one combined human review cycle).
   _⚙ Status: `investigate` · lesson #9989_

7. **Milestone tip:**
   `<pending>` — the final commit that adds this file + README + milestone-package.
   _⚙ Status: `investigate` · lesson #9990_

8. **Paragraph-level citation window was sometimes awkward.**
   Numeric claims like "5 to 20x for episodic memory" needed the cite placed immediately after `20x` to fit the 50-char window, which occasionally pushed sentence flow. A future refinement: accept `\citeconv` anywhere in the sentence if the sentence ends with `\citeconv`, relaxing the mid-sentence requirement while preserving end-of-sentence attribution.
   _⚙ Status: `investigate` · lesson #9991_

9. **Template-literal backtick escaping in TypeScript tests tripped initial capcom-gate test authoring.**
   The LaTeX double-backtick quote convention collided with JS template-literal syntax. Caught and fixed quickly, but the test file now uses single-quoted strings + array join to avoid the collision. Document this in the next milestone's test-authoring note.
   _⚙ Status: `investigate` · lesson #9992_

10. **One typecheck-error-in-unused-helper slipped in at Phase 713.**
   A broken generic-type helper (`defaultThresholds` in compression-spectrum/spectrum.ts) passed unit tests but failed `tsc --noEmit`. Caught at phase-boundary typecheck and removed. Lesson: run typecheck, not just tests, before claiming a phase complete.
   _⚙ Status: `investigate` · lesson #9993_

11. **Grove re-ingest of the milestone is an open item.**
   The `tools/rehydrate-seattle-360.ts` pattern from the 360 engine ("Grove update per release — run rehydrate after each degree") should have an equivalent for convergent-substrate college concepts. Not shipped this milestone; noted for follow-on.
   _⚙ Status: `investigate` · lesson #9994_
