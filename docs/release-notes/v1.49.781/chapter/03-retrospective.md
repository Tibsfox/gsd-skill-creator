# v1.49.781 — Retrospective

## decisions

- **Recon-first scoping.** Before applying any rename, surveyed the 6 candidate files and their importers to confirm what the actual structural debt was. The REVIEW ledger's "3 chip-registry.ts files" turned out to be 2, with different classes; the "MemoryStore adapter for 7 memory backends" turned out to already exist with 4 of 9 stores conforming. The wedge that emerged (5 renames + 5 doc comments) was much smaller than the ledger's framing implied. Spending ~15min on recon before ~45min of execution saved ~2-3 days of doing the wrong refactor.

- **Path A + Path B combined into one ship.** Operator picked the combined Path-A-and-B option rather than splitting into v781 (renames) + v782 (MemoryStore audit). After recon, the audit reduced to documentation work — too small to warrant its own ship.

- **Class names match record types.** All four namespace-split renames follow the rule "class name = record-type-name + Store". `CalibrationAdjustmentStore` stores `CalibrationAdjustment`; `CalibrationEventStore` stores `CalibrationEvent`; `SkillEventStore` stores `EventEntry` (for inter-skill events); `TelemetryEventStore` stores `UsageEvent` (for skill-usage telemetry). The rule generalizes: when two same-name stores exist across subsystems, disambiguate via their record type.

- **Filename matches exported class.** `src/chipset/teams/chip-registry.ts` exporting `class EngineRegistry` was a latent confusion. Renaming the file to `engine-registry.ts` aligns the filename with the class — and avoids the cross-domain filename collision with `src/chips/chip-registry.ts` (which exports an entirely different `class ChipRegistry`). The two `ChipRegistry`-named files are intentionally separate; the renamed file makes that obvious from grep.

- **`Role:` header doc comments lock audit verdicts into the source.** The 5 non-conforming memory stores now carry an explicit "Role: NOT a `MemoryStore` tier" line in their module header docs explaining why (different record type / different lifecycle / conforms to a different interface). This prevents future REVIEW sweeps from re-flagging the same audit miss; the verdict is documented at the site, not just in the gitignored ledger.

- **Repeating v780's atomic-commit discipline.** 5 rename commits + 1 doc commit + 1 ship commit + 1 post-ship RH commit. Same shape as v780 (each commit independently shippable + bisectable). Per-commit verification (`npx tsc --noEmit` + `npx vitest run <touched-dirs>`) caught no regressions.

## surprises

- **The MemoryStore adapter already existed.** v780's handoff carried forward the ledger's framing of "extract MemoryStore adapter for 7 memory backends" as if no such interface existed. In fact `src/memory/types.ts` already defines a concrete `MemoryStore` interface, and 4 of 9 stores already implement it. The remaining 5 stores serve different roles entirely — `MemoryStore` is for `MemoryRecord` LOD-tier lifecycle, while ContentAddressedStore / TripleStore / ConversationStore / etc. each have their own record shape and lifecycle. The audit's outcome was therefore "5 role boundary comments" not "5 adapter implementations."

- **`chip-registry.ts` × 2 was a filename collision, not a class duplicate.** REVIEW ledger phrasing ("3 chip-registry.ts" — actually 2) implied a class-level duplicate. Inspection revealed `ChipRegistry` vs `EngineRegistry` — different classes that happened to share a filename. The fix is "make the filename reflect the class", not "merge the classes." This is a lesson candidate for the ledger-authoring discipline: when noting duplicate-filename pairs, also note whether the exported class names match.

- **`EventStoreConfig` needed renaming for consistency.** When renaming `src/telemetry/EventStore` → `TelemetryEventStore`, the associated configuration interface `EventStoreConfig` (in `src/telemetry/types.ts`) also needed to become `TelemetryEventStoreConfig` to keep the naming aligned. Originally not in scope; surfaced during the bulk-rename sed and folded into commit 4. Same logic could apply elsewhere — when renaming a class, check whether peer interfaces (Config, Options, Result) share the prefix.

## process

- **Wall-clock:** ~1h end-to-end (recon ~15m + execution ~30m + ship ~15m).
- **Commits:** 7 (5 renames + 1 doc + 1 ship + 1 post-ship RH).
- **Push events:** 4 (push dev + push tag + push main; post-ship push dev + push main).
- **Full-suite test runs:** 1 (1 known perf-flake failure; 30,767/30,820 pass).
- **`SC_SELF_MOD=1 cp` invocations:** 0 (no hook touches this ship).
