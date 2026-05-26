# Retrospective — v1.49.790

## Carryover lessons applied

This ship is itself a meta-application of multiple disciplines:

- **Lesson #10412 — Recon-first as default.** Read v789 handoff + v784 codification ship retro + the seven candidate-emit lessons (v785/786/787/789 `04-lessons.md`) + the existing `docs/ledger-driven-work-discipline.md` template before writing any new doc. ~5 min of recon surfaced the natural 2-cluster grouping (5 static-analysis lessons + 2 verdict lessons) versus the alternative 7-single-entry approach.
- **Lesson #10415 — Deferred-maintenance escalation.** The v787 ship's own lesson notes flagged codification as "ripe at next codification ship (likely v1.49.790-795 range)." Closing it at v790 (the earliest predicted window) honors the discipline being codified.
- **v784-codification precedent.** The same template applied: clustered lessons into thematic disciplines (not per-lesson entries), one canonical doc per discipline, manifest entries added to `disciplines.json`, render-claude-md re-run, single ship.

## What Worked

- **The 7 candidates clustered cleanly into 2 themes.** Five lessons (#10417-#10421) all about authoring CLI tools that scan or report; two lessons (#10422-#10423) all about the verdict-decision surface. No lesson belonged in two places; no lesson resisted clustering.
- **Existing template was directly reusable.** `docs/ledger-driven-work-discipline.md` (v784 codification output) provided the section structure (Why this discipline exists / Discipline patterns / Anti-pattern summary / Lesson references) verbatim. Doc authoring became a fill-in-the-blanks exercise rather than a design problem.
- **render-claude-md tool just worked.** Same as v784 ship's observation — updated `disciplines.json`, ran `npm run render:claude-md`, no errors. `--check` reports "CLAUDE.md is up to date." after regen.
- **Field-validated lesson promoted with citation.** #10421's promotion to ESTABLISHED cites the specific v789 adoption-baseline diff line (`↑ semantic-channel: test-only → living`) as evidence — the lesson predicted the diff at v787, the diff materialized at v789, the codification at v790 anchors the promotion on that exact evidence. Self-verifying loop closed.
- **No code churn.** Manifest + 2 docs + 1 release-notes set. Zero source-code changes; zero new tests; pre-tag-gate's vitest step exercises existing tests only.

## What Could Be Better

- **`disciplines.json` could express "candidate vs ESTABLISHED" directly.** Currently the field `key_lessons` is a flat array of IDs — there's no distinction in the manifest between a lesson that's ESTABLISHED-codified and one that's a candidate. The promotion semantic is in operator memory + release notes. A future schema extension could mark each lesson `status: "established" | "candidate"` so the candidate backlog is queryable from data, not from prose.
- **The 6-ship gap (v784 → v790) is too long.** v784 codified 8 lessons; v790 codified 7. The interval is ~6 ships for both. A tighter codification cadence (every 3-4 ships when candidates accumulate) would keep the discipline-coverage gap smaller and reduce reliance on operator memory to track candidates between ships. Codification-frequency itself is a candidate for a future meta-lesson.
- **No automation to convert candidate → ESTABLISHED.** The promotion is a manual decision (operator picks codification path; LLM writes docs + manifest). A scripted check could enumerate candidate IDs across release notes and surface "N candidates ripe, next codification ship overdue" at pre-tag-gate time.

## Surprises

- **Wall-clock came in well under estimate.** v784 codified 8 lessons in ~40 min. v790 codified 7 in ~15-20 min (recon + 2 docs + manifest + render + release notes), with the ship still ahead. The v784 retro flagged "doc authoring is the bottleneck" — that scales sub-linearly with lesson count when the disciplines cluster cleanly.
- **The field-validated lesson is the strongest single signal in the backlog.** #10421's prediction (made at v787) held exactly at v789. That single self-verifying cycle is more compelling than 5 candidate IDs collectively — it shifts the promotion decision from "we've seen the pattern enough times" to "we made a falsifiable prediction and it held." Worth recognizing as a higher promotion-confidence tier.
- **`SHELFWARE-VERDICTS.md` was already canonical.** Including it as a second `canonical_docs` entry for the Shelfware verdict patterns domain made the manifest entry self-documenting — operators reading CLAUDE.md will see both the abstract discipline (`shelfware-verdict-patterns.md`) and the concrete ledger (`SHELFWARE-VERDICTS.md`) cross-referenced together.

## Lessons applied at v1.49.790 (from v1.49.789 and earlier)

- **#10412** (recon-first default) — applied during the 2-cluster grouping analysis.
- **#10415** (deferred-maintenance escalation) — the codification ship itself honored this; the 7-lesson backlog crossed the threshold at v787 + acquired a field-validation at v789, codifying within the next-ship window kept the discipline-coverage gap from accumulating.
- **#10419** (commit a baseline) — re-validated as the mechanism that produced #10421's field-validation evidence.
- **#10421 candidate** (warm-up period) — promoted to ESTABLISHED with the v789 diff cited as field-validation.

## Open lessons watchlist (apply at next opportunity)

- **#10417-#10421** (Static-analysis tool authoring) — apply at the next CLI authoring task in `tools/` (any analyzer, normalizer, refresh orchestrator, or drift checker).
- **#10422-#10423** (Shelfware verdict patterns) — apply at the second shelfware verdict ship (T1.2 ship 4) — `tonnetz` RETIRE or `wasserstein-hebbian` ALLOWLIST are the recommended next candidates.
