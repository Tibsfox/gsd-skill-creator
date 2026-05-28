# v1.49.861 — Context

## Provenance

Fifth ship of the operator-directed v857-v867 follow-on campaign; **fourth chip of Track 2** (Process singleton chips).

`src/cli/commands/keystore.ts` chosen because: 167 LOC, single spawn() call site inside shellOut helper, existing test file with established async-import patterns. CLI-wrapper variant (matches v858 drift/cli.ts shape but with #10442 consideration that turned out unnecessary).

## What this ship adds

```
src/cli/commands/keystore.ts                  [MODIFIED: ctx? threaded through keystoreCommand + shellOut; hoisted ensureProcessAllowed before Promise constructor]
src/cli/commands/keystore.test.ts             [MODIFIED: +3 test cases in new ProcessContext wire describe block]
src/security/process-context-audit.test.ts    [MODIFIED: removed from KNOWN_UNWIRED + v861 wire-shape comment]
docs/release-notes/v1.49.861/                 [NEW: README + 4 chapters]
```

## Recon trail

1. **Pick next chip target** — `src/cli/commands/keystore.ts` (167 LOC, smallest remaining CLI surface; potential #10442 candidate).
2. **Read source** — `keystoreCommand` validation + `shellOut` async helper around spawn().
3. **Check #10442 applicability** — child.on('error') handler is scoped to ENOENT/post-spawn errors only; no swallowing catch around spawn. #10442 re-throw NOT needed.
4. **Apply wire** — import block + ctx? on keystoreCommand + ctx? on shellOut + hoisted check BEFORE Promise constructor.
5. **Update audit-test KNOWN_UNWIRED.**
6. **Add 3 test cases** — restrictive ctx on status subcommand throws ProcessContextDenied; --help bypasses; unknown-subcommand bypasses.
7. **Run targeted tests** — 16 PASS for keystore.test.ts + 2051 PASS for audit-test + clean cross-audit.
8. **Pre-tag-gate** — pending.
9. **Author release notes.**

## T14 ship sequence

Per `docs/T14-SHIP-SEQUENCE.md`.

## Wire shape (per Lesson #10427)

Hoist-outside-Promise variant. Same shape as v859 (blitter/executor) but without temp-dir cleanup (shellOut doesn't pre-allocate). The child.on('error') handler is intentionally narrow (post-spawn errors only); security denials propagate through the async-function throw machinery.

## Discipline-extension vs new-domain choice

**EXTENSION of zero existing disciplines** (no discipline doc changes this ship). v861 applies the v847-codified #10433 internal-helper pattern (shellOut is the helper) + the v839-codified #10427 hoisted-check pattern.

## Chip status

**Track 2 progress: 4 of ~5 chips shipped.** Remaining: ~1 chip, v862.

KNOWN_UNWIRED Process: 8 → 7. Remaining entries (7):
- `src/chipset/harness-integrity.ts` (1440 LOC, 1 cp-call)
- `src/cli/commands/pic2html.ts` (311 LOC) — #10442 still candidate
- `src/git/gates/pre-flight.ts` (363 LOC, 18 cp-calls) — DI-executor
- `src/git/workflows/contribute.ts` (183 LOC, 11 cp-calls) — DI-executor
- `src/learn/acquirer.ts` (509 LOC, 13 cp-calls) — DI-executor
- `src/learning/version-manager.ts` (177 LOC, exec via promisify)
- `src/scan-arxiv/ranker.ts` (560 LOC, 1 cp-call)

## References

- Predecessor: v1.49.860 (`docs/release-notes/v1.49.860/`)
- Cross-audit tool: `tools/security/check-stale-known-unwired.mjs`
- Wire pattern: hoist-outside-Promise (variant of v859 without temp-dir cleanup)
