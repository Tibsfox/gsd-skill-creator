> Following v1.49.860 — _ProcessContext singleton chip: `src/intelligence/provenance/linker.ts`_, v1.49.861 is the **fourth chip of Track 2** in the v857-v867 follow-on campaign. Wires `src/cli/commands/keystore.ts` (CLI wrapper for the Rust keystore binary) through the ProcessContext chokepoint. Hoist-outside-Promise variant; child.on('error') handler catches ENOENT but security denials propagate through the async-function throw machinery per #10427. **KNOWN_UNWIRED Process count: 8 → 7.** Cross-audit tool reports clean.

# v1.49.861 — ProcessContext singleton chip: `src/cli/commands/keystore.ts`

**Shipped:** 2026-05-28

Fourth chip of Track 2. The `keystoreCommand` CLI wrapper spawns `skill-creator-keystore` (Rust binary) via `spawn` for the v1.49.636 hybrid Node-wrapper + standalone-Rust-bin keystore architecture. Wire threads `ctx?` through `keystoreCommand` and the internal `shellOut` helper; `ensureProcessAllowed` is hoisted OUTSIDE the Promise constructor in `shellOut` so synchronous denials propagate through the async-function throw machinery.

The `child.on('error')` handler INSIDE the Promise catches post-spawn errors (ENOENT for missing binary, etc.) and returns specific exit codes — but those are post-spawn errors, NOT security denials. Security denials fire pre-spawn from the hoisted check and propagate to the CLI dispatcher per #10427.

## What shipped

- **MODIFIED** `src/cli/commands/keystore.ts` — imports `ensureProcessAllowed` + `ProcessContext`; `keystoreCommand(args, io, ctx?)` accepts optional `ctx`; `shellOut(bin, args, io, ctx?)` accepts ctx and calls `ensureProcessAllowed(ctx, 'cli/commands/keystore', 'spawn', bin, args)` BEFORE the Promise constructor.
- **MODIFIED** `src/security/process-context-audit.test.ts` — removed `'src/cli/commands/keystore.ts'` from `KNOWN_UNWIRED` + inline comment documenting the v1.49.861 wire shape.
- **MODIFIED** `src/cli/commands/keystore.test.ts` — new `describe('keystoreCommand ProcessContext wire (v1.49.861)')` block with 3 test cases (deny on status subcommand + help bypass + unknown bypass).

## Test impact

| Surface | Tests | Notes |
|---|---|---|
| `src/cli/commands/keystore.test.ts` | +3 | 13 → 16 total |
| `src/security/process-context-audit.test.ts` | (no count change) | 2051 audit-test cases pass |
| `tools/security/check-stale-known-unwired.mjs` | clean | Process 7 + Egress 11; 0 stale |

## Engine state

NASA degree at **1.178** (UNCHANGED — **79 consecutive ships at 1.178**, new widest pressure margin record by 1 over v860's 78).
Counter-cadence count UNCHANGED at 6.
Manifest entries: **23** / Lessons: **84** / UNCODIFIED: **39 ≤ 41**.
**KNOWN_UNWIRED Process: 8 → 7.** Egress: **11** (UNCHANGED).
Operational axes: **4** (UNCHANGED).

## Wire shape (per Lesson #10427)

```ts
function shellOut(bin, args, io, ctx?: ProcessContext): Promise<number> {
  // Security: hoisted check outside the Promise — synchronous throw of
  // ProcessContextDenied propagates through the async keystoreCommand
  // wrapper to the CLI dispatcher. The child.on('error') handler below
  // catches post-spawn errors (ENOENT, etc.) but NOT security denials.
  ensureProcessAllowed(ctx, 'cli/commands/keystore', 'spawn', bin, args);
  return new Promise<number>((resolveExit) => {
    const child = spawn(bin, args, { stdio: ['inherit', 'pipe', 'pipe'] });
    // ...
    child.on('error', (err) => { /* ENOENT handler */ });
  });
}
```

Hoist-outside-Promise variant (matches v859 blitter/executor structurally but without the temp-dir cleanup since shellOut doesn't pre-allocate resources). The error handler INSIDE the Promise stays scoped to post-spawn errors; security denials fire pre-spawn from the hoisted check.

## Surface delta

- 3 files modified
- +14 source LOC (3 LOC imports; 1 param to keystoreCommand + 1 LOC pass-through; 1 param to shellOut + 1 LOC ensureProcessAllowed + 7 LOC comment block; 6 LOC in audit-test KNOWN_UNWIRED swap)
- +45 test LOC (3 new test cases)
- 0 new dependencies
- 0 manifest changes
