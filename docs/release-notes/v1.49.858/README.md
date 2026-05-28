> Following v1.49.857 — _Codification Ship: Promote #10443 (Inverse-audit Stale-Entry Detection)_, v1.49.858 is the **second ship of the v857-v867 follow-on campaign** and the **first chip of the Process singleton chip cluster** (Track 2; v858-v862 planned). Wires `src/drift/cli.ts` (CLI wrapper for `skill-creator drift audit`) through the ProcessContext chokepoint. Hoist-at-top variant; no swallowing try/catch around the spawn so ProcessContextDenied propagates naturally. **KNOWN_UNWIRED Process count: 11 → 10.** Cross-audit tool `tools/security/check-stale-known-unwired.mjs` confirms clean state post-wire (v857 enforcement first applied to a chip ship).

# v1.49.858 — ProcessContext singleton chip: `src/drift/cli.ts`

**Shipped:** 2026-05-28

First chip ship of Track 2 (Process singleton chips) in the operator-directed v857-v867 follow-on campaign. The `driftCommand` CLI wrapper spawns `node scripts/drift/drift-audit.mjs` via `spawnSync` to forward `skill-creator drift audit ...` to the ESM audit script. Smallest Process KNOWN_UNWIRED entry at v857 close (81 LOC, 1 cp-call) — chosen first to re-establish the chip-cadence template after the v857 codify ship.

## What shipped

- **MODIFIED** `src/drift/cli.ts` — imports `ensureProcessAllowed` + `ProcessContext`; `driftCommand(args, ctx?: ProcessContext)` accepts optional `ctx` as second positional parameter; `ensureProcessAllowed(ctx, 'drift/cli', 'spawn-sync', process.execPath, spawnArgs)` hoisted BEFORE the `spawnSync` call. No swallowing try/catch around the spawn — ProcessContextDenied propagates naturally to the CLI dispatcher.
- **MODIFIED** `src/security/process-context-audit.test.ts` — removed `'src/drift/cli.ts'` from `KNOWN_UNWIRED`, replaced with inline comment documenting the v1.49.858 wire shape.
- **NEW** `src/drift/__tests__/cli.test.ts` — 3 test cases verifying the wire (help-path bypass + unknown-subcommand bypass + ProcessContextDenied propagation on audit subcommand with restrictive ctx).

## Test impact

| Surface | Tests | Notes |
|---|---|---|
| `src/drift/__tests__/cli.test.ts` | NEW; +3 | First test file for this CLI command |
| `src/security/process-context-audit.test.ts` | (no count change) | 2051 audit-test cases pass; file no longer in `KNOWN_UNWIRED` allowlist |
| `tools/security/check-stale-known-unwired.mjs` | (re-runs clean) | Cross-audit reports 0 stale entries — Process 10, Egress 11 |

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — **76 consecutive ships at 1.178**, new widest pressure margin record by 1 over v857's 75).
Counter-cadence count UNCHANGED at 6.

Manifest entries: **23** (UNCHANGED).
Lessons in manifest (unique): **84** (UNCHANGED).
UNCODIFIED: **39 ≤ ceiling 41** (UNCHANGED).
**KNOWN_UNWIRED Process: 11 → 10.**
KNOWN_UNWIRED Egress: **11** (UNCHANGED).
Operational axes: **4** (UNCHANGED).

## Wire shape (per Lesson #10427)

```ts
export async function driftCommand(
  args: string[],
  ctx?: ProcessContext,
): Promise<number> {
  // ... help-path + unknown-subcommand bypass return early
  switch (sub) {
    case 'audit': {
      const spawnArgs = [DRIFT_AUDIT_SCRIPT, ...rest];
      // Security: hoisted check outside the spawn — there is no swallowing
      // try/catch around this spawn, so ProcessContextDenied propagates
      // naturally to the caller.
      ensureProcessAllowed(ctx, 'drift/cli', 'spawn-sync', process.execPath, spawnArgs);
      const result = spawnSync(process.execPath, spawnArgs, { ... });
      // ...
    }
  }
}
```

Matches v849 (`changelog-watch`) hoist-at-top variant. The argv vector is pre-computed into `spawnArgs` so the audit-telemetry representation and the actual `spawnSync` invocation share the exact same argv.

## Surface delta

- 3 files modified/created
- +12 source LOC (4 LOC in `cli.ts` — import block + 1 param + 1 spawnArgs hoist + 1 ensureProcessAllowed call + comment; 5 LOC in audit-test KNOWN_UNWIRED swap; 60 LOC test file)
- 0 new dependencies
- 0 manifest changes

## Stale-audit confirmation (v857 tool first applied)

`node tools/security/check-stale-known-unwired.mjs` runs clean post-chip (Process 10 entries, Egress 11 entries; 0 Shape A; 0 Shape B; 0 missing). The v857 inverse-audit tool is in production use as the per-chip post-edit verification — first application this ship.
