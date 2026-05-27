# v1.49.840 — Context

## Provenance

Codify ship per #10428 meta-cadence (7 ships past last codify at v833; within 7-10 ship floor). Promotes 2 tentative observations to ESTABLISHED lessons; extends 2 existing disciplines.

Predecessor v1.49.839 closed the 4-ship operational-debt session (v836→v839; publish-investigation + predictive low-confidence wire + audit-inverse-check + ProcessContext chip). The accumulated tentative observations from that session + the v833 carry-forwards were ready for consolidation; v840 is the consolidation.

## What this ship adds

```
docs/two-layer-closure-discipline.md      [MODIFIED: +File-overwrite drift sub-class section (#10436)]
docs/failure-mode-contracts.md            [MODIFIED: +Subscriber-gated context-hook pattern section (#10437)]
tools/render-claude-md/disciplines.json   [MODIFIED: +#10436 to Two-layer closure key_lessons; +#10437 to Failure-mode contracts key_lessons; canonical_docs + trigger + summary + codified_at_milestone updates]
CLAUDE.md                                 [MODIFIED: regenerated via npm run render:claude-md]
docs/release-notes/v1.49.840/             [NEW: README + 4 chapters]
.planning/PROJECT.md                      [MODIFIED: pre-bump refresh]
```

## Recon trail (per #10422 ledger-driven work)

1. **Read predecessor handoff** (`.planning/HANDOFF-2026-05-27-v1.49.836-839-operational-debt-session-closed.md`). 5 codify-eligible patterns enumerated at v839 close.
2. **Read each candidate's first-instance lessons file** (v813 + v836 for #10431 sub-pattern; v810 + v826 + v830 + v832 for subscriber-gated hooks; v829 + v832 for verification/integration-only; v838 + v836 for bidirectional enforcement).
3. **Read v824 codify-ship release notes** as template (the most recent extend-existing-domain codify ship).
4. **Read existing canonical docs** (`docs/two-layer-closure-discipline.md` + `docs/failure-mode-contracts.md`) to confirm extension homes.
5. **Pick scope:** 2 lessons (#10436 + #10437). Defer 3 candidates honestly (verification/integration-only ships per missing canonical-doc home; bidirectional enforcement per classification ambiguity; #10433 LOC-band refinement is already ESTABLISHED, only counted for sustainability).
6. **Draft + edit disciplines.json** for both extended entries (key_lessons append + summary + trigger + canonical_docs + codified_at_milestone).
7. **Edit `docs/two-layer-closure-discipline.md`** — add "File-overwrite drift sub-class" section with layer-mapping table, when-it-applies criteria, how-to-apply recipe, anti-patterns, v836 reference implementation, cross-references.
8. **Edit `docs/failure-mode-contracts.md`** — add "Subscriber-gated observability-only context-hook pattern" section with structural-shape code template, 4-instance reference implementation table, PAIR co-location refinement, how-to-apply recipe, anti-patterns, cross-references.
9. **Render CLAUDE.md** — `npm run render:claude-md` writes new disciplines section cleanly; pre-existing agent-drift warning (observer + v1.50a-*) is tolerated by default render mode (only flagged in `--check` / `--diff`).
10. **Author release notes** — 5 files (README + 4 chapters).
11. **Verify build + tests** — `npm run build` clean; full suite expected at v839 close baseline (35,259 PASS) since no source changes were made.

## Discipline-extension vs new-domain choice

**EXTENSION of 2 existing disciplines** rather than introducing new domains. Both extensions follow the v824 template (key_lessons append + summary extension + codified_at_milestone history). No new manifest entries; manifest holds at 23 domains.

The 2 deferred candidates (Verification/integration-only ships + Bidirectional enforcement completeness) would have required either new manifest entries (verification/integration-only — no existing doc covers ship-shape axes) or a 3rd-instance disambiguation (bidirectional enforcement — could be subsumed into #10436 or extracted as a separate gate-direction discipline). Deferring is correct per the codify-ship sustainability rate (~2 lessons per ship).

## What was deferred

- **Verification/integration-only ships axis** (2 instances v829 + v832). Would need a new sub-doc or extension to `docs/meta-cadence-discipline.md`. Defer to v847+ codify ship; pickup trigger is a 3rd instance OR an explicit operator decision to author the canonical doc.
- **Bidirectional enforcement completeness** (1-2 instances v838 + v836). Classification ambiguous between "specific case of #10436 (closure-direction-symmetry)" and "new pattern about gate-direction-symmetry as a discipline of its own". Defer until a 3rd instance disambiguates.
- **Auto-run-on-import as bootstrap-time tax** (1 instance v836). Below 2-instance threshold.
- **Polarity convention for inverted-mechanic thresholds** (1 instance v837). Below 2-instance threshold.

## Verification trail

| Step | Result |
|---|---|
| `python3 -c "import json; json.load(open('tools/render-claude-md/disciplines.json'))"` | JSON OK; 23 entries / 78 unique lessons (#10436 + #10437 added; was 76) |
| `npm run render:claude-md` | CLAUDE.md updated cleanly |
| `npm run build` | PASS |
| `node tools/check-discipline-coverage.mjs` | UNCODIFIED 39 (UNCHANGED; new lessons emit here for the first time) |
| `bash tools/pre-tag-gate.sh` | 17/17 PASS (pending T14 step 1) |
| Full suite (expected) | 35,259 (UNCHANGED — no source-code changes) |

## T14 ship sequence (operator-only authorization)

Per Lesson #10191 + #10184 + #10197. Canonical sequence at `docs/T14-SHIP-SEQUENCE.md`.

Milestone-specific notes:
- Codify ship — extends 2 existing disciplines + regenerates CLAUDE.md. Zero source-code changes; zero new tests.
- v836 preservation gate continues to fire (5th time at v840's T14 publish step).
- Pre-tag-gate's flaky `update-outcome.test.ts` may surface again — rerun on first failure.

## Forward path post-v840

1. **NASA 1.179 forward-cadence** — STRONG-DEFAULT (58 consecutive ships at 1.178 after this ship — record-widest pressure margin again).
2. **Continued ProcessContext singleton chips** — terminal family batch (3 entries) + remaining ~17 singletons.
3. **Production caller of the predict path** — would activate v837's auto-emit wire.
4. **Next codify ship (~v847-850)** — pickup candidates: verification/integration-only ships axis (needs canonical-doc decision), bidirectional enforcement completeness (needs 3rd instance), any newly-surfaced 2-instance patterns.

## References

- Predecessor: v1.49.839 (`docs/release-notes/v1.49.839/`)
- Predecessor handoff: `.planning/HANDOFF-2026-05-27-v1.49.836-839-operational-debt-session-closed.md` (resolved by this ship)
- Last codify ship: v1.49.833 (`docs/release-notes/v1.49.833/` — #10435 Cross-rootdir wire pattern, new domain)
- Codify template precedent: v1.49.824 (`docs/release-notes/v1.49.824/` — #10433 + #10434, extend-existing pattern)
- Two-layer closure discipline: `docs/two-layer-closure-discipline.md` (Lesson #10431 + #10436)
- Failure-mode contracts discipline: `docs/failure-mode-contracts.md` (Lesson #10427 + #10437)
- Meta-cadence discipline: `docs/meta-cadence-discipline.md` (Lesson #10428 — the cadence rule that triggered this ship)
- v836 first instance evidence: `tools/release-history/publish.mjs` (`shouldPublishToDestination`)
- v813 first instance evidence: `tools/state-md-set-shipped.mjs` + `tools/pre-tag-gate.sh` step 0.5
- v810/v826 onPredictions instances: copper + selector `_emitPredictions` paths
- v830/v832 fallbackProvider instances: copper + selector `ActivationContext` types
