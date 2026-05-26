# v1.49.784 — Retrospective

## decisions

- **3 new domain entries, not 8 single-lesson entries.** The 8 lesson candidates clustered naturally into 3 themes — REVIEW-ledger-and-audit-rule discipline (5 lessons), architecture-retrofit patterns (2 lessons), deferred-maintenance escalation (1 lesson). Authoring 8 single-lesson entries would have produced repetition (multiple "before executing a REVIEW ledger entry" triggers) and made the operative-disciplines section unreadable. Clustering by theme produced 3 dense, distinct entries that read as a checklist rather than a wall of items.

- **3 new canonical docs, one per domain.** Could have stuffed all 3 disciplines into a single "v784-codification.md" doc. Rejected — each domain has a distinct trigger surface and will be cross-referenced from different parts of the codebase. Single-doc-per-domain matches the precedent set by the 10 existing disciplines and keeps the surface area searchable.

- **Lesson IDs assigned sequentially #10409–#10416.** Highest existing formal ID is #10408. Gaps in the existing numbering (#10392, #10405) are retired or never-emitted; assigning sequentially after #10408 avoids re-using a retired ID. The candidate-to-formal mapping is documented in the README's table.

- **Codification ship counts as forward-cadence, not counter-cadence.** Counter-cadence is reserved for operational-debt drains that introduce gates or hooks (v585, v776-779). A codification ship that updates manifests + docs but introduces no new gates is forward-cadence work. The counter-cadence count stays at 5.

- **Followed the lesson it codifies.** The 8-lesson backlog itself was an escalated deferred-maintenance item per the discipline being codified (#10415 — close escalated wedges within 1-2 milestones). Closing the backlog at v784 (one milestone after v783 escalated it as "queued for codification") honors the discipline.

## surprises

- **The render-claude-md tool just worked.** Updated disciplines.json, ran `npm run render:claude-md`, no errors, no fixture drift, no test failures. The tool was designed for this exact use case at v1.49.653 (L-04) and has been silently maintained well enough to survive ~130 ships without regression.

- **CLAUDE.md is gitignored.** Confirmed via `git check-ignore` — the file lives locally and is regenerated on demand from manifests in `tools/render-claude-md/`. So the codification ship commits the source-of-truth manifest + docs, NOT the rendered output. The post-2026-05-10 untrack design has been quietly load-bearing.

- **`check-discipline-coverage.mjs` shows manifest growth immediately.** Manifest entries 10 → 13; manifest lessons 49 → 57. The coverage report distinguishes "in manifest" from "in release-notes" — my new formal IDs are in the manifest but won't be referenced in release-notes until v784's own 04-lessons.md is published. The COVERED count stays at 49 until that crosswalk closes.

- **Total wall-clock came in under estimate.** Estimated ~45min; actual ~40min including the 5-file release-notes set. Suggests the codification discipline scales well — the bottleneck is doc authoring, not template work.

## process

- **Wall-clock:** ~40 minutes end-to-end (lesson cluster analysis ~5m + 3 canonical docs ~15m + disciplines.json edit ~3m + CLAUDE.md regen ~1m + coverage verify ~2m + release-notes ~10m + ship ~5m).
- **Commits:** 1 pre-ship (docs codification) + 1 ship + 1 post-ship RH.
- **Push events:** 4 (push dev + push tag + push main; post-ship push dev + push main).
- **TS test runs:** 1 (render-claude-md test).
- **Full-suite vitest:** SKIPPED. The codification ship touches only manifests + docs; no code changes that could regress runtime behavior. The render-claude-md unit-test suite (21/21) is the targeted coverage.
- **`SC_SELF_MOD=1` or `SC_FORCE_ADD=1` overrides:** 0. No hook touches this ship.
- **Errors:** 0.
