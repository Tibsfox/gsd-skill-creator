# v1.49.852 — Context

## Provenance

Fifth ship of the operator-directed v848-v856 nine-ship campaign; fourth of five ProcessContext singleton chip ships. Variant: **stale-import cleanup** rather than wire.

`scan-arxiv/bridge.ts` chosen as the fourth chip because:
- Grep for `execFileSync` showed import-only (no call sites)
- Dead-code removal is the lightest possible chip variant
- Second instance of stale-entry pattern (v834 was the first)

## What this ship adds

```
src/scan-arxiv/bridge.ts                       [MODIFIED: removed unused `import { execFileSync } from 'node:child_process'`]
src/security/process-context-audit.test.ts     [MODIFIED: removed from KNOWN_UNWIRED + cross-reference comment to v834 stale-entry-wired variant]
docs/release-notes/v1.49.852/                  [NEW: README + 4 chapters]
```

## Recon trail

1. **Picked `src/scan-arxiv/bridge.ts`** from remaining KNOWN_UNWIRED list.
2. **`grep execFileSync src/scan-arxiv/bridge.ts`** showed only the import line — no call sites.
3. **Removed import line + KNOWN_UNWIRED entry simultaneously.** Single edit each.
4. **Build + audit-test pass** — 2051 PASS. File out of audit scope (no `node:child_process` import) and removed from allowlist (no longer needs to be).
5. **Pre-tag-gate** running.
6. **Author release notes.**

## T14 ship sequence

Per `docs/T14-SHIP-SEQUENCE.md`.

## Wire-variant catalog (v849-v852 so far)

| Ship | File | Variant | Notes |
|---|---|---|---|
| v849 | `changelog-watch.ts` | Hoist-at-top, single-call-site | First chip; v839 forensic-surface template |
| v850 | `extension-detector.ts` | Hoist-inside-branch, DI-override early-return | Placement variant for two-strategy probes |
| v851 | `version-backfill.ts` | Hoist-at-top, single-call-site | Byte-equivalent to v849; new test file |
| v852 | `scan-arxiv/bridge.ts` | Stale-import cleanup (no wire) | Dead-code removal; 2nd stale-entry instance |

v853 (planned, last chip ship of the campaign) will continue the same pattern catalog. Likely candidates include `src/dashboard/collectors/git-collector.ts`, `src/learn/acquirer.ts`, `src/intelligence/provenance/linker.ts`, or another remaining singleton.

## Discipline-extension vs new-domain choice

**EXTENSION of zero existing disciplines** (no discipline doc changes this ship). v852 surfaces a CODIFICATION-READY observation (stale-entry detection inverse-audit tool, 2 instances v834+v852) but this ship is chip-execution scope, not codification. Forward-flag to next codify ship documented in 04-lessons.

## Test impact

Total full-suite count: ~34,794 (UNCHANGED). Dead-code removal; no test changes. Audit-test stays at 2051.

## Cross-references

- v1.49.834 — first stale-entry chip (wired-but-still-in-allowlist variant)
- v1.49.806 — ProcessContext chokepoint introduction + audit-unidirectionality forward-observation
- v1.49.851 / v1.49.850 / v1.49.849 — prior chip ships in the campaign
- `docs/known-unwired-ledger-discipline.md` — #10432 ratchet-ledger discipline (natural home for the v852 codify-ready observation)
- `docs/security-chokepoints.md` — canonical wire-shape catalog
