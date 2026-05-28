# v1.49.860 — Context

## Provenance

Fourth ship of the operator-directed v857-v867 follow-on campaign; **third chip of Track 2** (Process singleton chips). First Track 2 application of #10433 internal-helper pattern.

`src/intelligence/provenance/linker.ts` chosen because: 408 LOC with an internal `git()` helper called from 4 sites — perfect fit for #10433 internal-helper wire. Plus existing integration test file with real git fixtures.

## What this ship adds

```
src/intelligence/provenance/linker.ts                          [MODIFIED: ctx? threaded through git() helper + resolveMissionCommits + ProvenanceLinker.run; hoisted ensureProcessAllowed at the helper's spawn site]
src/intelligence/provenance/__tests__/linker.test.ts           [MODIFIED: +3 test cases in new ProcessContext wire describe block; uses async-import + FK-disabled seed]
src/security/process-context-audit.test.ts                     [MODIFIED: removed from KNOWN_UNWIRED + v860 wire-shape comment]
docs/release-notes/v1.49.860/                                  [NEW: README + 4 chapters]
```

## Recon trail

1. **Pick next chip target** — `src/intelligence/provenance/linker.ts` (408 LOC, single internal helper wrapping 4 spawnSync sites).
2. **Read source** — `git()` internal helper + `resolveMissionCommits` (1 git call) + `ProvenanceLinker.run` (3 git calls).
3. **Read existing test file** — integration tests using real git fixtures; 8 cases.
4. **Apply wire** — internal-helper pattern: ctx? on `git()` + 2 exported entry points; hoisted `ensureProcessAllowed` at helper spawn site.
5. **Thread ctx through call sites** — 4 internal callers + the 2 entry points' delegation.
6. **Update audit-test KNOWN_UNWIRED** — remove entry + replace with #10433 internal-helper wire-shape comment.
7. **Add 3 test cases** — async-import + FK-disabled seed pattern.
8. **Two test setup hiccups** — NOT NULL on recorded_at (fix: add value); FOREIGN KEY on decision_id (fix: `db.pragma('foreign_keys = OFF')`).
9. **Build + targeted test** — 11 PASS for linker tests + 2051 PASS for audit-test + clean cross-audit.
10. **Pre-tag-gate** — pending.
11. **Author release notes.**

## T14 ship sequence

Per `docs/T14-SHIP-SEQUENCE.md`.

## Wire shape (per Lesson #10433 internal-helper)

Internal-helper variant. Single `ensureProcessAllowed` at the helper's spawn site protects 4 downstream callers. Lightest possible wire for files with an existing internal helper around the spawn surface.

## Discipline-extension vs new-domain choice

**EXTENSION of zero existing disciplines** (no discipline doc changes this ship). v860 applies the v847-codified #10433 internal-helper pattern; the v857-codified #10443 cross-audit is in continuous-verification mode.

## Chip status

**Track 2 progress: 3 of ~5 chips shipped.** Remaining: ~2 chips, v861-v862.

KNOWN_UNWIRED Process: 9 → 8. Remaining entries (8):
- `src/chipset/harness-integrity.ts` (1440 LOC, 1 cp-call)
- `src/cli/commands/keystore.ts` (167 LOC) — #10442 re-throw likely
- `src/cli/commands/pic2html.ts` (311 LOC) — #10442 re-throw likely
- `src/git/gates/pre-flight.ts` (363 LOC, 18 cp-calls) — DI-executor candidate
- `src/git/workflows/contribute.ts` (183 LOC, 11 cp-calls) — DI-executor candidate
- `src/learn/acquirer.ts` (509 LOC, 13 cp-calls) — DI-executor candidate
- `src/learning/version-manager.ts` (177 LOC, exec via promisify)
- `src/scan-arxiv/ranker.ts` (560 LOC, 1 cp-call)

## References

- Predecessor: v1.49.859 (`docs/release-notes/v1.49.859/`)
- Cross-audit tool: `tools/security/check-stale-known-unwired.mjs`
- Wire pattern: internal-helper (#10433 codified v847)
