# v1.49.781 — Tier E Architecture: Store/Registry Naming Hygiene + MemoryStore Audit

**Released:** 2026-05-26
**Type:** forward-cadence architecture milestone (NOT a NASA degree advance)
**Predecessor:** v1.49.780 — Tier E Architecture: cli.ts Dispatcher Extraction
**Engine state:** UNCHANGED (NASA degree sustains at 1.177; MUS / ELC / SPS / TRS SCAFFOLD-PENDING obs#60+)
**Architecture pass:** Tier E HIGH #2 of 3 (REVIEW ledger 2026-05-26)

## Summary

**Second Tier E architecture forward-cadence ship.** Continues the architecture-debt drain from v780. v780 closed Tier E HIGH #1 (cli.ts dispatcher); v781 closes Tier E HIGH #2 (Store / Registry / Manager dedup + MemoryStore conformance audit).

**The recon flip.** The REVIEW ledger's original framing of HIGH #2 was: "85 `Store`/`Registry`/`Manager` classes — specific dedup pairs: 3 `chip-registry.ts`, 2 `calibration-store.ts`, 2 `event-store.ts`. Extract `MemoryStore` adapter for 7 memory backends." Pre-execution recon flipped both halves of that estimate:

1. **The "3 chip-registry.ts files" were 2, and they were NOT duplicates.** `src/chips/chip-registry.ts` exports `class ChipRegistry`; `src/chipset/teams/chip-registry.ts` exports `class EngineRegistry`. Different classes, just shared filename. Fix is RENAME (one file → `engine-registry.ts` to match its class), not MERGE.
2. **The 2 `calibration-store.ts` files were genuinely same-name across subsystems with no cross-domain consumer.** `src/eval/CalibrationStore` stores per-capability `CalibrationAdjustment` records; `src/calibration/CalibrationStore` stores `CalibrationEvent` JSONL records. Type-shadow risk + ambiguous grep. Fix is NAMESPACE SPLIT (rename each to match its record type).
3. **The 2 `event-store.ts` files were the same shape.** `src/events/EventStore` stores `EventEntry` for inter-skill communication; `src/telemetry/EventStore` stores `UsageEvent` for skill-usage telemetry. Fix is NAMESPACE SPLIT.
4. **The `MemoryStore` adapter already exists.** `src/memory/types.ts` defines the `MemoryStore` interface with concrete methods (`store(record: MemoryRecord)`, `query(q: MemoryQuery)`, `get/has/remove/count`). 4 of the 9 stores in `src/memory/` already implement it: `FileStore`, `ArenaFileStore`, `ChromaStore`, `PgStore`. The other 5 (`ConversationStore`, `ContentAddressedStore`, `ContentAddressedSetStore`, `TripleStore`, `GroveStore`) persist fundamentally different record types (ConversationTurn, raw bytes, hash refs, Triple, Grove records) and SHOULD NOT implement `MemoryStore`. The "widening" work the ledger called for collapsed into "documenting role boundaries."

**The shape.** 5 atomic rename commits + 1 doc-comment commit + this ship. ~1h wall-clock total (v780-shape ship).

| Commit | SHA | Subject |
|---|---|---|
| 1 | `4632d939d` | refactor(eval): rename CalibrationStore to CalibrationAdjustmentStore |
| 2 | `93ee790c3` | refactor(calibration): rename CalibrationStore to CalibrationEventStore |
| 3 | `228cae7f2` | refactor(events): rename EventStore to SkillEventStore |
| 4 | `5ef652ab6` | refactor(telemetry): rename EventStore to TelemetryEventStore |
| 5 | `f32e16861` | refactor(chipset): rename chip-registry.ts to engine-registry.ts |
| 6 | `b3a99e492` | docs(memory): mark non-MemoryStore stores as separate roles |

## File changes

| Path | Action |
|---|---|
| `src/eval/calibration-store.ts` | renamed → `calibration-adjustment-store.ts`; class `CalibrationStore` → `CalibrationAdjustmentStore` |
| `src/calibration/calibration-store.ts` | renamed → `calibration-event-store.ts`; class `CalibrationStore` → `CalibrationEventStore` |
| `src/events/event-store.ts` | renamed → `skill-event-store.ts`; class `EventStore` → `SkillEventStore` |
| `src/telemetry/event-store.ts` | renamed → `telemetry-event-store.ts`; class `EventStore` → `TelemetryEventStore`; interface `EventStoreConfig` → `TelemetryEventStoreConfig` |
| `src/chipset/teams/chip-registry.ts` | renamed → `engine-registry.ts` (class `EngineRegistry` unchanged; filename now matches) |
| `src/memory/conversation-store.ts` | added `Role: NOT a MemoryStore tier` header doc |
| `src/memory/content-addressed-store.ts` | added `Role: NOT a MemoryStore tier` header doc |
| `src/memory/content-addressed-set-store.ts` | added `Role: NOT a MemoryStore tier` header doc |
| `src/memory/triple-store.ts` | added `Role: NOT a MemoryStore tier` header doc |
| `src/memory/grove-store.ts` | added `Role: NOT a MemoryStore sibling` header doc |
| Importers updated | `src/index.ts`, `src/eval/index.ts`, `src/calibration/index.ts`, `src/events/index.ts`, `src/telemetry/index.ts`, `src/chipset/teams/index.ts`, `src/cli/commands/calibrate.ts`, `src/cli/commands/event.ts`, `src/eval/model-aware-grader{.ts,.test.ts}`, `src/events/event-lifecycle{.ts,.test.ts}`, `src/telemetry/{usage-pattern-detector,telemetry-stage}{.ts,.test.ts}`, `src/application/skill-applicator{.ts,-telemetry.test.ts}`, `src/chipset/exec/kernel{.ts,.test.ts}`, `src/evaluator/success-tracker.ts` |

## Tests

- 30,820 tests across 1,927 files (30,767 passing, 1 pre-existing flake, 45 skipped, 7 todo).
- The single failing test (`src/intelligence/meetings/__tests__/update-outcome.test.ts:141`) is a known io-bound perf flake unrelated to renames (test cites Lesson #10182 v1.49.636 threshold widening).
- All 5 renamed classes pass their direct test suites (CalibrationAdjustmentStore 43, CalibrationEventStore 89, SkillEventStore 75, TelemetryEventStore 114, EngineRegistry 192).

## Forward path

Tier E HIGH #3 (LoaderContext security chokepoint, 14 disk-loaders) remains OPEN. Architecture-debt drain continues at v1.49.782+ unless engine-state work returns first.
