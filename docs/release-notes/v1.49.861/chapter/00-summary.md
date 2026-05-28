# v1.49.861 — ProcessContext singleton chip: `src/cli/commands/keystore.ts`

**Released:** 2026-05-28

## Why this ship

Fourth chip of Track 2. 167 LOC CLI wrapper for the v1.49.636 unified keystore. The shellOut helper spawns the Rust binary via spawn() inside a Promise constructor; existing tests expected #10442 re-throw consideration but the post-spawn error handler is scoped to ENOENT etc., so the simpler hoist-outside-Promise pattern applies.

## The wire

```ts
function shellOut(bin, args, io, ctx?): Promise<number> {
  ensureProcessAllowed(ctx, 'cli/commands/keystore', 'spawn', bin, args);
  return new Promise<number>((resolveExit) => {
    const child = spawn(bin, args, { ... });
    // child.on('error') catches ENOENT, not security denials
  });
}
```

Hoist-outside-Promise. The child.on('error') handler is intentionally narrow (ENOENT for missing binary); security denials fire pre-spawn from the hoisted check and propagate through the async keystoreCommand wrapper.

## Surface delta

- 3 files modified
- +14 source LOC + 45 test LOC
- 0 new test files (3 new cases in `keystoreCommand ProcessContext wire (v1.49.861)` describe block)
- KNOWN_UNWIRED Process: 8 → 7

## Engine state

NASA degree at **1.178** (UNCHANGED — 79 consecutive ships at 1.178).

## Stale-audit (v857 tool, 4th application — promotion-eligible at 4 instances)

`node tools/security/check-stale-known-unwired.mjs` — clean (Process 7, Egress 11, 0 stale).

The cross-audit tool has now run clean for 4 consecutive chip ships (v858-v861). At the next chip ship (v862) the tool will reach 5 consecutive clean applications, which crosses the typical promotion threshold for a sub-pattern observation. v862 retrospective will reassess.
