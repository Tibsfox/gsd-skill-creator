> Following v1.49.780 — _Tier E Architecture: cli.ts Dispatcher Extraction_, v1.49.781 ships as Tier E Architecture: Store/Registry Naming Hygiene + MemoryStore Audit.

# v1.49.781 — Tier E Architecture: Store/Registry Naming Hygiene + MemoryStore Audit

**Shipped:** 2026-05-26

The second Tier E architecture forward-cadence ship after v780 opened the series. Closes Tier E HIGH #2 from the v1.49.777 REVIEW ledger by:

- Renaming 4 same-class-name pairs across subsystems (CalibrationStore × 2, EventStore × 2) so each class name encodes the record type it stores (CalibrationAdjustmentStore, CalibrationEventStore, SkillEventStore, TelemetryEventStore).
- Renaming `src/chipset/teams/chip-registry.ts` to `engine-registry.ts` so the filename matches its exported class (the third "chip-registry" was a filename collision, not a class duplicate).
- Auditing the 9 store classes in `src/memory/` for `MemoryStore` interface conformance: 4 already implement it, 5 serve fundamentally different roles. Each non-conforming store now carries an explicit `Role: NOT a MemoryStore` header doc comment to lock the audit verdict.

5 atomic rename commits + 1 doc-comment commit; ~1h wall-clock. Engine state unchanged (NASA 1.177); counter-cadence count unchanged at 5.
