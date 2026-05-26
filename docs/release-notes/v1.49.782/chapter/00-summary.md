> Following v1.49.781 — _Tier E Architecture: Store/Registry Naming Hygiene + MemoryStore Audit_, v1.49.782 ships as Tier E Architecture: LoaderContext Security Chokepoint.

# v1.49.782 — Tier E Architecture: LoaderContext Security Chokepoint

**Shipped:** 2026-05-26

The third Tier E architecture forward-cadence ship — closes the architecture-debt drain opened at v780. v780 closed Tier E HIGH #1 (cli.ts dispatcher). v781 closed Tier E HIGH #2 (Store / Registry / Manager naming hygiene). v782 closes the final architecture HIGH from the 2026-05-26 REVIEW sweep:

- New `LoaderContext` interface in `src/security/`: `{ allowList: PathPattern[], audit: AuditSink }` with `ensureAllowed(ctx, source, op, target)` gate. `PathPattern = string | RegExp | predicate` — dependency-free.
- 11 disk-loaders migrated to accept `ctx?: LoaderContext` and route every `fs` touchpoint through the gate (`cartridge/loader`, `interpreter/loader`, `skill/lifecycle-loader`, `knowledge/{resource,activity,assessment,module}-loader`, `agc/tools/rope-loader`, `graph/trs-loader`, `scribe/pg-runtime/env-loader`, `cloud-ops/knowledge/tier-loader`).
- 4 false-positives marked with `Role: NOT a disk loader` headers (no `fs` import; the `-loader` suffix denotes a different semantic). Two pre-execution recon discoveries — the REVIEW ledger had said "14 disk-loaders, ctx in constructor"; reality was "15 cited, 11 actual disk-loaders, free functions not classes."
- Automated audit test enforces the chokepoint on every future `src/**/*loader*.ts` file: fs-importers MUST call `ensureAllowed` OR carry an explicit role-boundary header.

12 atomic commits + this ship; ~3h wall-clock. Engine state unchanged (NASA 1.177); counter-cadence count unchanged at 5.
