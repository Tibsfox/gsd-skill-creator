# v1.49.858 — Context

## Provenance

Second ship of the operator-directed v857-v867 follow-on campaign; **first chip of Track 2** (Process singleton chips). v857 codified + shipped the cross-audit tool; v858 opens the chip-execution cluster with the smallest remaining Process KNOWN_UNWIRED entry.

## What this ship adds

```
src/drift/cli.ts                              [MODIFIED: ctx? threaded through driftCommand; hoisted ensureProcessAllowed before spawnSync]
src/drift/__tests__/cli.test.ts               [NEW: 3 test cases verifying the wire (help bypass + unknown bypass + ProcessContextDenied propagation)]
src/security/process-context-audit.test.ts    [MODIFIED: removed from KNOWN_UNWIRED + v858 wire-shape comment]
docs/release-notes/v1.49.858/                 [NEW: README + 4 chapters]
```

## Recon trail

1. **Surveyed all 11 Process KNOWN_UNWIRED entries** — LOC + cp-call count.
2. **Picked `drift/cli.ts`** — smallest (81 LOC), 1 cp-call, no swallowing try/catch around the spawn. Simplest hoist-at-top shape.
3. **Read source** — `driftCommand(args)` switch on subcommand; only `audit` subcommand spawns.
4. **Checked for existing test file** — none. Scaffold new at `src/drift/__tests__/cli.test.ts`.
5. **Apply wire** — import block + ctx? param + spawnArgs hoist + ensureProcessAllowed call + inline comment.
6. **Update audit-test KNOWN_UNWIRED** — remove entry + replace with wire-shape comment block.
7. **Write test file** — 3 cases (help bypass + unknown bypass + ProcessContextDenied propagation).
8. **Run targeted tests** — 3 PASS for new file + 2051 PASS for audit-test + 6 PASS for stale-audit tool.
9. **Run cross-audit tool** — `node tools/security/check-stale-known-unwired.mjs` reports clean.
10. **Pre-tag-gate** — pending.
11. **Author release notes.**

## T14 ship sequence

Per `docs/T14-SHIP-SEQUENCE.md`.

Milestone-specific notes:
- First chip ship under the v857 codified inverse-audit. The tool ran clean post-wire (Process 10 / Egress 11; 0 stale).
- PROJECT.md pre-edit BEFORE pre-tag-gate held the 3-patch tolerance.

## Wire shape (per Lesson #10427)

Hoist-at-top variant; matches v849 (`changelog-watch`) but with `spawnSync` instead of `execSync`. Argv vector `spawnArgs = [DRIFT_AUDIT_SCRIPT, ...rest]` pre-computed so audit-telemetry and spawnSync share identical argv.

## Discipline-extension vs new-domain choice

**EXTENSION of zero existing disciplines** (no discipline doc changes this ship). v858 applies the v847-codified #10441 / #10442 shapes and the v839-codified #10427 hoisted-check pattern; the v857-codified #10443 cross-audit is in continuous-verification mode.

## Test impact

Total full-suite count: ~34,811 → ~34,814 (+3 test cases for new file). The audit-test stays at 2051.

## Chip status

**Track 2 progress: 1 of ~5 chips shipped (v858).** Remaining: ~4 chips, v859-v862.

KNOWN_UNWIRED Process: 11 → 10. Remaining entries (10):
- `src/chipset/blitter/executor.ts` (220 LOC)
- `src/chipset/harness-integrity.ts` (1440 LOC) — possibly multi-instance internal-helper variant
- `src/cli/commands/keystore.ts` (167 LOC) — #10442 re-throw likely needed
- `src/cli/commands/pic2html.ts` (311 LOC) — #10442 re-throw likely needed
- `src/git/gates/pre-flight.ts` (363 LOC, 18 cp-calls!) — likely needs DI-executor + tokenized-argv
- `src/git/workflows/contribute.ts` (183 LOC, 11 cp-calls!) — likely needs DI-executor + tokenized-argv
- `src/intelligence/provenance/linker.ts` (408 LOC)
- `src/learn/acquirer.ts` (509 LOC, 13 cp-calls!) — likely needs DI-executor
- `src/learning/version-manager.ts` (177 LOC, 0 cp-calls but uses `promisify(exec)` → `execAsync`)
- `src/scan-arxiv/ranker.ts` (560 LOC)

## References

- Predecessor: v1.49.857 (`docs/release-notes/v1.49.857/` — codify ship + cross-audit tool)
- Last chip ship before this: v1.49.853 (`docs/release-notes/v1.49.853/` — git-collector hoist-at-top async variant)
- Cross-audit tool: `tools/security/check-stale-known-unwired.mjs` (shipped v857)
- Wire template: `src/dashboard/collectors/git-collector.ts` (v853 hoist-at-top reference)
