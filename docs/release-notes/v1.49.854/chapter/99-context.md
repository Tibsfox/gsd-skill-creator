# v1.49.854 — Context

## Provenance

Seventh ship of the operator-directed v848-v856 nine-ship campaign; first verify-overdue ship under newly-codified #10438. The v1.49.843 mesh-family chip introduced the substrate (mesh-worktree.ts + proxy-committer.ts via DI-executor + tokenized-argv shape); v847 codified the verify-axis as #10438; v854 is the named follow-up that adds the integration test the v843 retrospective flagged as a gap.

## What this ship adds

```
tests/integration/mesh-default-executor.integration.test.ts   [NEW: 4 integration test cases against real git temp repos]
docs/release-notes/v1.49.854/                                  [NEW: README + 4 chapters]
```

## Recon trail

1. **Read `docs/meta-cadence-discipline.md` #10438 section** — verify axis is a first-class numbered lesson per v847.
2. **Identify substrate target** — v1.49.843 mesh family (mesh-worktree.ts + proxy-committer.ts); verify-overdue at v853 per the 10-ship threshold.
3. **Read existing integration tests** — `college-observation-bridge-wire.integration.test.ts` as the template.
4. **Read `src/mesh/mesh-worktree.ts`** — confirm `createMeshWorktreeManager` factory + default executor + #10441 DI shape.
5. **Author integration test** — 4 cases: default-executor-creates-branch, default-executor-lists-branches, ProcessContextDenied-propagates, allowed-with-audit.
6. **Verify against real git** — 4/4 pass; temp-dir cleanup works.
7. **Pre-tag-gate.** Running.
8. **Author release notes.**

## T14 ship sequence

Per `docs/T14-SHIP-SEQUENCE.md`.

## Discipline-extension vs new-domain choice

**EXTENSION of zero existing disciplines** (no discipline doc changes this ship). v854 is the first APPLIED instance of the #10438 verify-axis discipline; it doesn't extend the discipline doc, it implements the discipline.

## Verify-axis trigger forecast (post-v854)

Per #10438, verify-overdue triggers at `≥10 ships from first non-test caller and no integration test exists`. The next verify-overdue forecasts:

- **v837 predictive-low-confidence threshold** (CalibratableThreshold member added v837; first non-test caller v845) — verify-overdue at ~v855
- **v846 substrate auto-emit** (auto-recorder added v846; first non-test caller is the same ship) — verify-overdue at ~v856

v855 + v856 are already scoped for other work in the current campaign; the predict-path verify-overdue items will surface in a future campaign.

## Test impact

Total full-suite count: ~34,797 → ~34,801 (+4 integration test cases).

## Cross-references

- v1.49.843 — substrate ship (mesh family wire)
- v1.49.847 — #10438 verify-axis codification
- v1.49.841 — most recent prior verify ship under canonical-doc-set v844 (pre-codification)
- v1.49.829 / v1.49.832 — the two evidence-base verify ships #10438 references
- `docs/meta-cadence-discipline.md` — #10438 canonical home
- `docs/security-chokepoints.md` — #10441 DI-executor + tokenized-argv shape
