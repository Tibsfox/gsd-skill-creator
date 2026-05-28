# v1.49.853 — Context

## Provenance

Sixth ship of the operator-directed v848-v856 nine-ship campaign; fifth and last of five ProcessContext singleton chip ships. Closes the chip-execution cluster; v854 opens the verify ship.

`git-collector` chosen as the fifth/last chip because:
- 221 LOC, single execFile call site
- Existing test file with `vi.mock('child_process')` infrastructure
- Fault-tolerant accessory contract documented in source
- Async execFile (vs sync execSync) — exercises async-throw test variant alongside sync v849+v851 surfaces

## What this ship adds

```
src/dashboard/collectors/git-collector.ts          [MODIFIED: ctx? threaded through collectGitMetrics; hoisted ensureProcessAllowed per #10427]
src/dashboard/collectors/git-collector.test.ts     [MODIFIED: +3 test cases (async deny, allow with audit, backward-compat)]
src/security/process-context-audit.test.ts         [MODIFIED: removed from KNOWN_UNWIRED + v853 wire-shape comment]
docs/release-notes/v1.49.853/                      [NEW: README + 4 chapters]
```

## Recon trail

1. **Picked `git-collector.ts`** from remaining KNOWN_UNWIRED list — 221 LOC, single call site, existing test infrastructure.
2. **Read source + tests** — `collectGitMetrics(options)` with fault-tolerant try/catch; existing tests mock `child_process` via `vi.mock`.
3. **Apply wire** — import + ctx? param + hoisted ensureProcessAllowed.
4. **Update audit-test KNOWN_UNWIRED.**
5. **Add 3 test cases** — async deny (`await expect(...).rejects.toThrow`), allow with audit, backward-compat.
6. **Build + targeted test.** 2065 PASS.
7. **Pre-tag-gate** — pending (running).
8. **Author release notes.**

## T14 ship sequence

Per `docs/T14-SHIP-SEQUENCE.md`.

## Wire shape (per Lesson #10427)

Hoist-at-top + async variant. Pattern matches v851 (`version-backfill`) except the spawn is `execFileAsync` instead of sync `execSync`. The argv vector `args` is already computed earlier in the function; the audit-telemetry argv === actual-spawn argv (no shell-string-vs-argv divergence like in v851).

## Discipline-extension vs new-domain choice

**EXTENSION of zero existing disciplines** (no discipline doc changes this ship). v853 applies the v847-codified #10441 / #10442 shapes and the v839-codified #10427 hoisted-check pattern; no new shape introduced.

## Test impact

Total full-suite count: ~34,794 → ~34,797 (+3 test cases). The audit-test stays at 2051.

## Chip-cluster summary

5-chip batch (v849-v853) completed:
- 4 wires (changelog-watch, extension-detector, version-backfill, git-collector)
- 1 stale-import cleanup (scan-arxiv/bridge)
- Net KNOWN_UNWIRED Process: 16 → 11 (-5 entries, -31% of grandfathered list)
- 3 pattern variants exercised (hoist-at-top × 3, hoist-inside-branch × 1, stale-import-cleanup × 1)
- 0 audit-test regressions, 0 backward-compat breaks, 0 build breaks

## Cross-references

- v1.49.852 / v1.49.851 / v1.49.850 / v1.49.849 — prior chip ships of the campaign
- v1.49.847 — #10441 + #10442 codification (wire-shape lessons applied this cluster)
- v1.49.839 — `stalled.ts` forensic-surface hoisted-check precedent
- v1.49.806 — ProcessContext chokepoint introduction
- `docs/security-chokepoints.md` — canonical wire-shape catalog
