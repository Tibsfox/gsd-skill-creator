# v1.49.847 — Context

## Provenance

Codify ship per #10428 meta-cadence (7 ships past last codify at v840; at the lower bound of the 7-10 ship floor). Promotes the full eligible backlog of 5 tentative observations to ESTABLISHED lessons; extends 4 existing disciplines (Meta-cadence × 2, Architecture-retrofit patterns × 1, Security chokepoints × 1, Failure-mode contracts × 1).

Predecessor v1.49.846 closed the substrate auto-emit gap that v837 + v845 had partially closed (read-side wire + CLI manual recorder). The v841-v846 cluster's 5 ships accumulated 3 net new tentative observations (CLI/auto-emit duality, production-caller path-narrowing, fire-and-forget over awaited) on top of the 2 carried-forward from v840 (verify axis, DI-executor + tokenized-argv) and the 1 from v842 (ProcessContextDenied re-throw). Operator decided to clear the full eligible backlog in one ship.

## What this ship adds

```
docs/meta-cadence-discipline.md            [MODIFIED: +#10438 + #10439 sections (verify axis + calibrate-axis completeness)]
docs/architecture-retrofit-patterns.md     [MODIFIED: +#10440 subsection (production-caller path-narrowing) + lesson references append]
docs/security-chokepoints.md               [MODIFIED: +#10441 section (DI-executor + tokenized-argv) + cross-references append]
docs/failure-mode-contracts.md             [MODIFIED: +#10442 section (ProcessContextDenied re-throw) + lesson references append]
tools/render-claude-md/disciplines.json    [MODIFIED: +#10438, #10439 to Meta-cadence key_lessons; +#10440 to Architecture-retrofit patterns key_lessons; +#10441 to Security chokepoints key_lessons; +#10442 to Failure-mode contracts key_lessons; 4 summaries + 4 codified_at_milestone records updated]
CLAUDE.md                                  [MODIFIED: regenerated via npm run render:claude-md]
docs/release-notes/v1.49.847/              [NEW: README + 4 chapters]
```

## Recon trail (per #10412 recon-first + #10422 ledger-driven work)

1. **Read predecessor handoff** (`.planning/HANDOFF-2026-05-28-v1.49.846-auto-emit-from-substrate.md`). 5 codify-eligible candidates enumerated at v846 close.
2. **Read each candidate's source-ship lessons file** (v803 token-budget for #10439 first instance; v820 ProcessContextDenied for #10442 first instance; v825 repo-manager for #10441 first instance; v829 + v832 for #10438 evidence base; v842 + v843 for #10441 second/third + #10442 second instances; v844 for #10438 canonical-doc-decision; v845 + v846 for #10439 + #10440 evidence).
3. **Read v840 codify-ship release notes** as template (the most recent extend-existing-domain codify ship).
4. **Read existing canonical docs** (`docs/meta-cadence-discipline.md` + `docs/architecture-retrofit-patterns.md` + `docs/security-chokepoints.md` + `docs/failure-mode-contracts.md`) to confirm extension homes for all 5 lessons.
5. **Decide scope:** all 5 lessons per operator decision. Verify preconditions: (a) all 5 have existing canonical-doc homes ✓; (b) operator chose larger scope ✓; (c) zero new manifest domains ✓.
6. **Draft + edit disciplines.json** for all 4 extended entries (key_lessons append + summary extension + codified_at_milestone history record).
7. **Edit `docs/meta-cadence-discipline.md`** — add #10438 + #10439 sections + update Codified-at header.
8. **Edit `docs/architecture-retrofit-patterns.md`** — add #10440 subsection + lesson references append + update Codified-at header.
9. **Edit `docs/security-chokepoints.md`** — add #10441 section + cross-references append + update Codified-at header.
10. **Edit `docs/failure-mode-contracts.md`** — add #10442 section + lesson references append + update Codified-at header.
11. **Render CLAUDE.md** — `npm run render:claude-md` writes new disciplines section cleanly; pre-existing agent-drift warning (observer + v1.50a-*) is tolerated by default render mode.
12. **Author release notes** — 5 files (README + 4 chapters).
13. **Verify build + tests** — `npm run build` clean; full suite expected at v846 close baseline (34,786 PASS) since no source changes were made.

## Discipline-extension vs new-domain choice

**EXTENSION of 4 existing disciplines** rather than introducing new domains. All 5 lessons either refine an existing parent lesson directly (#10440 ← #10422/#10423; #10441 ← #10433; #10442 ← #10427) or refine an existing axis structure within an existing domain (#10438 + #10439 both refine #10428 Meta-cadence). The manifest holds at 23 domains; lessons-in-manifest goes 78 → 83.

The structural cleanliness is the operator-recognizable signal that the discipline-as-data system is maturing: new patterns are increasingly refinements rather than novelties.

## What was NOT promoted

Nothing eligible was deferred. All 5 candidates that reached the 2-instance threshold (or in #10441's case, 3-instance threshold) were promoted in this ship. Below-threshold observations (1-instance candidates) remain on the carried-forward list:

- Fire-and-forget over awaited for observability writes (v846, 1 instance).
- Canonical-doc-decision ship pattern (v844, 1 instance).
- Recent-vs-baseline-recent comparison pattern (v841, 1 instance).
- Drift-check noise as scoring-system feedback loop (v841, 1 instance).
- Codify-ship-as-recon-consolidator pattern (v840, 1 instance).
- Deferral-by-classification-ambiguity (v840, 1 instance).
- Auto-run-on-import as bootstrap-time tax (v836, 1 instance).
- Polarity convention for inverted-mechanic thresholds (v837, 1 instance).
- Bidirectional enforcement completeness (v838 + v836, 1-2 instances; ambiguous; DEFERRED v840 — UNCHANGED v847).
- Full-backlog-clear codify ship pattern (v847 THIS SHIP, 1 instance).

## Verification trail

| Step | Result |
|---|---|
| `python3 -c "import json; json.load(open('tools/render-claude-md/disciplines.json'))"` | JSON OK; 23 entries / 83 unique lessons (5 added; was 78) |
| `npm run render:claude-md` | CLAUDE.md updated cleanly; all 5 new lessons render in respective domain entries |
| `npm run build` | (expected) PASS |
| `node tools/check-discipline-coverage.mjs` | UNCODIFIED 39 (UNCHANGED; new lessons emit here for the first time) |
| `bash tools/pre-tag-gate.sh` | (expected) 17/17 PASS |
| Full suite (expected) | 34,786 (UNCHANGED — no source-code changes) |

## T14 ship sequence (operator-only authorization)

Per Lesson #10191 + #10184 + #10197. Canonical sequence at `docs/T14-SHIP-SEQUENCE.md`.

Milestone-specific notes:
- Codify ship — extends 4 existing disciplines + regenerates CLAUDE.md. Zero source-code changes; zero new tests.
- v836 preservation gate continues to fire (12+ times since v836).
- Pre-tag-gate's flaky `update-outcome.test.ts` may surface — rerun on first failure.

## Forward path post-v847

1. **NASA 1.179 forward-cadence** — STRONG-DEFAULT (65 consecutive ships at 1.178 after this ship — record-widest pressure margin by 1 again).
2. **Continued ProcessContext singleton chips** — ~14 remaining singletons.
3. **Help text expansion in `src/cli/help.ts`** — add `predict-next` + other recent commands.
4. **Verify ship for v843 mesh family** — becomes verify-overdue at ~v853 per the newly-codified #10438's trigger.
5. **Next codify ship (~v854-857)** — pickup candidates: 2nd-instance achievements of currently-carried 1-instance observations.

## References

- Predecessor: v1.49.846 (`docs/release-notes/v1.49.846/`)
- Predecessor handoff: `.planning/HANDOFF-2026-05-28-v1.49.846-auto-emit-from-substrate.md` (resolved by this ship)
- Last codify ship: v1.49.840 (`docs/release-notes/v1.49.840/` — #10436 + #10437 extend-existing pattern)
- Codify template precedents: v1.49.840 (extend-existing × 2); v1.49.824 (extend-existing × 2); v1.49.802 (new-domain × 2 + extend × 1)
- Meta-cadence discipline: `docs/meta-cadence-discipline.md` (Lesson #10428 + new #10438 + #10439)
- Architecture-retrofit patterns: `docs/architecture-retrofit-patterns.md` (Lesson #10414 + #10416 + #10426 + new #10440)
- Security chokepoints: `docs/security-chokepoints.md` (Lesson #10414 + #10426 + #10427 + #10433 + new #10441)
- Failure-mode contracts: `docs/failure-mode-contracts.md` (Lesson #10427 + #10437 + new #10442)
- v829 + v832 first-instance evidence for #10438: `tests/integration/college-observation-bridge-wire.integration.test.ts` + `tests/integration/copper-rosetta-fallback-wire.integration.test.ts`
- v803 + v845/v846 first-instance evidence for #10439: token-budget calibration loop + predictive low-confidence loop
- v845 + v846 first-instance evidence for #10440: CLI + substrate auto-emit both bypass ActivationSelector/PipelineActivationDispatch wrappers
- v825 + v843 first-instance evidence for #10441: `src/git/core/repo-manager.ts` + `src/mesh/mesh-worktree.ts` + `src/mesh/proxy-committer.ts`
- v820 + v842 first-instance evidence for #10442: `src/git/branch-manager.ts` + `src/cli/commands/terminal.ts`
