# v1.49.858 — ProcessContext singleton chip: `src/drift/cli.ts`

**Released:** 2026-05-28

## Why this ship

Second ship of the operator-directed v857-v867 follow-on campaign; **first chip of Track 2** (Process singleton chips). v857 codified the stale-entry inverse-audit + shipped the tool; v858 opens the chip-execution cluster with the smallest remaining Process KNOWN_UNWIRED entry.

`drift/cli.ts` was chosen as the first chip because:
- 81 LOC, single spawnSync call site (smallest Process KNOWN_UNWIRED entry by line count)
- No swallowing try/catch around the spawn — simplest hoist-at-top shape; no #10442 re-throw needed
- No existing test file — establishes the "new-test-file" sub-variant pattern (matches v851 `version-backfill` variant)
- Forwards to an ESM audit script via `node` subprocess — the spawn target is `process.execPath`, not a domain-specific tool, which surfaces a CLI-wrapper variant of the wire

## The wire

```ts
export async function driftCommand(
  args: string[],
  ctx?: ProcessContext,
): Promise<number> {
  // ...help-path + unknown-subcommand bypass
  switch (sub) {
    case 'audit': {
      const spawnArgs = [DRIFT_AUDIT_SCRIPT, ...rest];
      ensureProcessAllowed(ctx, 'drift/cli', 'spawn-sync', process.execPath, spawnArgs);
      const result = spawnSync(process.execPath, spawnArgs, { ... });
      // ...
    }
  }
}
```

4 LOC change. Hoist-at-top shape; matches v849 (`changelog-watch`) variant but with `spawnSync` instead of `execSync`. Argv pre-computed into `spawnArgs` so audit-telemetry and spawnSync invocation share the exact same argv.

## Surface delta

- 3 files modified/created
- +12 source LOC + 60 test LOC
- 1 new test file (`src/drift/__tests__/cli.test.ts` — no prior test surface for this CLI command)
- 0 manifest changes
- 0 new dependencies
- KNOWN_UNWIRED Process: 11 → 10

## Engine state

NASA degree at **1.178** (UNCHANGED — **76 consecutive ships at 1.178**, new widest pressure margin record by 1 over v857's 75).
Counter-cadence count UNCHANGED at 6.
Operational axes UNCHANGED at 4.

## Stale-audit confirmation (v857 tool first applied at chip ship)

`node tools/security/check-stale-known-unwired.mjs` runs clean post-chip:
```
ProcessContext (KNOWN_UNWIRED: 10)
  clean
EgressContext (KNOWN_UNWIRED: 11)
  clean
all allowlists clean
```

First application of the v857 inverse-audit tool against an actual chip output. The tool's exit-0 confirms: no Shape A regression (drift/cli.ts is no longer in the allowlist AND calls ensureProcessAllowed); no Shape B regression (the import is used). v857 → v858 the tool is in continuous-verification mode for every chip ship in Track 2 + Track 3.
