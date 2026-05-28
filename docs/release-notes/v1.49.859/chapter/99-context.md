# v1.49.859 — Context

## Provenance

Third ship of the operator-directed v857-v867 follow-on campaign; **second chip of Track 2** (Process singleton chips).

`src/chipset/blitter/executor.ts` chosen as second chip because: 220 LOC (2nd smallest Process KNOWN_UNWIRED entry), 1 spawn() call site, existing test file. Introduces hoist-outside-Promise variant (3rd wire shape after hoist-at-top + hoist-inside-branch).

## What this ship adds

```
src/chipset/blitter/executor.ts               [MODIFIED: ctx? threaded through executeOffloadOp + OffloadExecutor.execute; hoisted ensureProcessAllowed before Promise constructor; temp-dir cleanup on denial]
src/chipset/blitter/executor.test.ts          [MODIFIED: +3 test cases in new ProcessContext wire describe block]
src/security/process-context-audit.test.ts    [MODIFIED: removed from KNOWN_UNWIRED + v859 wire-shape comment]
docs/release-notes/v1.49.859/                 [NEW: README + 4 chapters]
```

## Recon trail

1. **Pick next chip target** — `src/chipset/blitter/executor.ts` (2nd smallest Process KNOWN_UNWIRED at 220 LOC, 1 cp-call).
2. **Read source** — `executeOffloadOp(operation)` async with mkdtemp + writeFile setup then `new Promise` wrapping spawn().
3. **Read existing test file** — 10 cases; existing `vi.mock`-free tests use real bash spawn against tempDir.
4. **Apply wire** — import block + ctx? param on both `executeOffloadOp` and `OffloadExecutor.execute`; hoisted check BEFORE the Promise constructor with synchronous temp-dir cleanup on denial.
5. **Update audit-test KNOWN_UNWIRED** — remove entry + replace with wire-shape comment.
6. **Add 3 test cases** — deny (ProcessContextDenied thrown + temp dir cleaned + audit sink captures denial) + allow (real bash echo runs) + wrapper-denied (OffloadExecutor.execute propagates denial).
7. **Run targeted tests** — 13 PASS for executor.test.ts + 2051 PASS for audit-test + 6 PASS for stale-audit tool.
8. **Run cross-audit tool** — `node tools/security/check-stale-known-unwired.mjs` clean (Process 9 + Egress 11).
9. **Pre-tag-gate** — pending.
10. **Author release notes.**

## T14 ship sequence

Per `docs/T14-SHIP-SEQUENCE.md`.

## Wire shape (per Lesson #10427)

Hoist-outside-Promise variant. New sub-shape of #10427: when the wire's setup phase allocates resources before the spawn, the hoisted check must catch the denial + clean up + re-throw. v859 cleans up `scriptDir` (the temp directory mkdtemp'd at line 95) before re-throwing the ProcessContextDenied.

## Discipline-extension vs new-domain choice

**EXTENSION of zero existing disciplines** (no discipline doc changes this ship). v859 surfaces a 1-instance pre-allocated-resource cleanup pattern as a tentative observation; wait for 2nd instance for codification.

## Chip status

**Track 2 progress: 2 of ~5 chips shipped.** Remaining: ~3 chips, v860-v862.

KNOWN_UNWIRED Process: 10 → 9. Remaining entries (9):
- `src/chipset/harness-integrity.ts` (1440 LOC, 1 cp-call)
- `src/cli/commands/keystore.ts` (167 LOC) — #10442 re-throw likely
- `src/cli/commands/pic2html.ts` (311 LOC) — #10442 re-throw likely
- `src/git/gates/pre-flight.ts` (363 LOC, 18 cp-calls) — DI-executor candidate
- `src/git/workflows/contribute.ts` (183 LOC, 11 cp-calls) — DI-executor candidate
- `src/intelligence/provenance/linker.ts` (408 LOC, 1 cp-call)
- `src/learn/acquirer.ts` (509 LOC, 13 cp-calls) — DI-executor candidate
- `src/learning/version-manager.ts` (177 LOC, exec via promisify)
- `src/scan-arxiv/ranker.ts` (560 LOC, 1 cp-call)

## References

- Predecessor: v1.49.858 (`docs/release-notes/v1.49.858/`)
- Cross-audit tool: `tools/security/check-stale-known-unwired.mjs`
- Wire shape: hoist-outside-Promise (new variant for v859)
