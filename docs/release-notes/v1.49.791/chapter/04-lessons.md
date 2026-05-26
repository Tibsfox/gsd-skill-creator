# 04 — Lessons Learned: v1.49.791 Second + Third Shelfware Verdicts

## 1 candidate emitted (#10424)

**Lesson #10424 candidate — Prose-in-handoff warnings about non-obvious tool sequencing don't survive multi-ship intervals; migrate to a deterministic gate.**
Severity: MEDIUM. The v789 handoff documented "adoption-baseline filename uses current package.json version; run `adoption-report:refresh` AFTER `bump-version`, not before." The v790 ship explicitly noted this in its 04-lessons (under "Operational notes" / "What Could Be Better") as a forward-improvement candidate. This ship STILL ran refresh before bump and overwrote the committed v1.49.790 baseline. Recovery was a 30-second `git checkout HEAD --`; the cost is small. The recurrence pattern is what matters: TWO prior milestones flagged the sequencing constraint and the THIRD milestone tripped it anyway. Prose-in-handoff signaling is insufficient for tool-sequencing constraints that affect committed artifacts. Migrate to either (a) a `--force` flag refusal: if `docs/ADOPTION-BASELINE-v${currentVersion}.{md,json}` already exists in git, refuse to overwrite without `--force`; OR (b) a pre-tag-gate detection step that catches the drift. Apply: every operational-sequencing constraint that has tripped 2+ ships should migrate from prose to a deterministic gate or flag.
Promotion track: candidate at v1.49.791; promotes to ESTABLISHED on second instance.

## Disciplines reinforced (no new IDs)

- **#10412 (Recon-first as default)** — applied + validated again. ~5min of source-code recon on `src/tonnetz/index.ts` + `src/wasserstein-hebbian/index.ts` + the SHELFWARE-VERDICTS.md candidate notes flipped the v790 handoff's "tonnetz RETIRE cleanest" recommendation to "ALLOWLIST both" before any code was written. 4th consecutive application since v784 codification. Promoted to "default" at v784 — this ship validates the promotion held.
- **#10422 candidate-now-ESTABLISHED (Verdict-pattern surface separation)** — applied: the verdict ship touches `tools/adoption-scan.allowlist.json` (observability annotation), `docs/SHELFWARE-VERDICTS.md` (decision surface), and `.planning/PROJECT.md` (project-state surface) independently. Source modules at `src/tonnetz/` and `src/wasserstein-hebbian/` are byte-untouched. First forward application of the discipline codified at v790.
- **#10423 candidate-now-ESTABLISHED (Lightest wire that satisfies the verdict)** — applied: ALLOWLIST is the lightest possible verdict shape (no code authoring, no in-loop wire, no dispatcher edit). The verdict's intent — "this module is intentionally test-only and should not trigger the shelfware threshold" — is satisfied with 2 allowlist JSON entries + 2 ledger rows + 0 code changes. First forward application of the discipline codified at v790.

## What's now codified that wasn't before

Nothing new in the manifest — this ship validates existing disciplines (#10412 recon-first; #10422 surface separation; #10423 lightest wire) and emits one new candidate (#10424). Total candidate backlog at v791 close: 1 (#10424). Far below the historical codification threshold; no codification ship needed for at least 4-7 more milestones.

## Forward backlog

| ID | Severity | Apply | Source |
|---|---|---|---|
| #10424 candidate | MEDIUM | Operational-sequencing constraints that have tripped 2+ ships | v791 adoption-refresh-before-bump re-trip |

## Discipline-coverage status post-ship

Manifest entries: 15 → 15 (no new domain)
Manifest lessons: 64 → 64 (no formal ID emitted; #10424 awaits second instance)
Codified-vs-uncodified gap: unchanged (the 40 uncodified lesson backlog from older ships is independent of this candidate)
