# v1.49.973 — Retrospective

## What went right

- **The adversarial review caught the exact failure this ship exists to prevent.** Ship 1.3's whole purpose is to stop the dispatch doc from asserting unverified harness premises — and the first pass did exactly that, over-claiming that the ~60-70 tool-use ceiling and 64K output-cap were "lifted" on Opus 4.8. The doc-accuracy lens refuted that on the empirical record (v729-v773 dispatches still run ~28-54 tool uses; the v767 95K-target test landed at 47), so the doc was narrowed to "only the SendMessage premise genuinely changed." Dogfooding the review on a doc-accuracy ship paid for itself.
- **Premises were tied to evidence, not enthusiasm.** Every retained capability claim is sourced to the Agent/Workflow tool contracts (SendMessage continuation, `run_in_background`, `resumeFromRunId`, 1M context) or to release-note data (the tool-use band). Claims that couldn't be backed (output-cap lifted, SendMessage "context intact") were dropped or qualified with Lesson #10158.
- **The plan's own premise was corrected.** The 2026-06-03 plan asserted the "60-70 tool-use ceiling" premise was false; verification showed it is still active. Recording that in the doc (reaffirmed, not superseded) prevents the next author from re-introducing the over-claim.

## What went well in process

- **CI on dev was the safety net for two regressions the targeted local tests missed.** The handoff order (push → CI → pre-tag-gate) surfaced (1) a `gupp-propulsion/SKILL.md` word-budget overflow (889 > 800) from the first HAL-note draft, and (2) a discipline-coverage PARTIAL when "Lesson #10158" entered the canonical doc without being in `key_lessons`. Both were deterministic, fixed on the working branch, and main never saw them.
- **The fixes followed the project's own contracts.** The budget overflow was resolved by moving the note into `references/runtime-strategies.md` — exactly the SKILL.md/references split CF-H-030 enforces. The PARTIAL was resolved by codifying #10158 into `key_lessons` (a real, relevant lesson) rather than de-citing it.

## What to watch

- **The reaffirmed ~60-70 band is empirical, not a hard cap.** If Opus 4.8 dispatch behavior shifts (longer sustained runs become routine), the band should be re-measured from release-note data and the doc updated — don't let "reaffirmed at v973" calcify.
- **The constrained-harness fallback machinery must stay** until non-Claude-Code runtime adapters land; the runtime HAL registers 14 such runtimes. A future "cleanup" that deletes the polling / chunked-Write+Edit guidance would break multi-runtime support.
- **CLAUDE.md (repo-root) is the slim distribution copy**, and `npm run render:claude-md` is a no-op on it (no AUTO markers); the disciplines render relies on disciplines.json + the harness's context injection. Worth confirming the operator's intended CLAUDE.md form on a later ship — out of scope here (gitignored, the committed source-of-truth disciplines.json carries the change).
