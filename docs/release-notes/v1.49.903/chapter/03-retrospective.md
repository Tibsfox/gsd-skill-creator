# Retrospective — v1.49.903

## What Worked

**v902's carry-forward note was load-bearing — again.** v900 → v902 was the first instance of "pre-staged decision in carry-forward note saves analysis time at chip-pick." v902 → v903 reinforces it: v902's release notes explicitly identified `keystore.ts` as the unique-smallest entry, named the deferral reason (sync-existsSync wire shape distinct from current async wires), and predicted this exact chip. The v903 chip author opened v902's release notes, read the prediction, confirmed it still held, and started the wire — analysis time was effectively zero.

**Sync two-site hoisted-check is a clean sub-variant of #10448.** The wire shape mirrors v892's async two-site hoisted-check (`dacp/bus/scanner.ts`), but with `existsSync` instead of `readdir`/`access`. The LoaderContext interface admits the sync `'exists-check'` LoaderOp tag without modification — no interface change was needed at v903.

**Sibling-chokepoint independence per #10449 just works.** `keystore.ts` already had `ctx?: ProcessContext` at v861. Adding `loaderCtx?: LoaderContext` as a 4th param required no design discussion — the contexts thread independently via separate param positions. The shape generalizes to any future class needing 2-of-N sibling chokepoints.

**Variable audit-record count (1 OR 2) was a new shape under #10456.** Prior #10456 instances (v892, v896, v897, v900, v902) were all fixed-count-per-call. v903 surfaces a variable-count case: site 1 returns early (1 audit), site 2 loops (2 audits if reached). The test asserts both branches explicitly. Carry-forward observation: #10456's "exact N under K invocations" formulation may need a variable-N annotation in the catalog for early-return wire shapes.

## What Could Have Been Better

**resolveKeystoreBin signature now has 2 different chokepoint params on adjacent surfaces.** `keystoreCommand(args, io, ctx?: ProcessContext, loaderCtx?: LoaderContext)` is workable but unergonomic. A future ergonomic improvement would be a single combined `SecurityContext` interface — but per #10449, sibling chokepoints stay separate, so this would be a deliberate aggregation, not a default. Not blocking; carry-forward only.

## Lessons Learned

See [04-lessons.md](04-lessons.md) for details. No new manifest-promoted lessons; v903 reinforces #10444, #10448 (with NEW sync-existsSync sub-variant candidate), #10449, #10456 (with variable-count observation).
