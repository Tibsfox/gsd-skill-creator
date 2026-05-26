# v1.49.781 — Lesson candidates

3 lessons emitted, all candidate-status pending codification at next milestone.

---

## #L781-1 — Recon flips scope estimates more often than not

**Signal.** Before touching any file, surveyed the 6 candidate files + their importers. The REVIEW ledger had framed Tier E HIGH #2 as "85 Store/Registry/Manager classes + 3 dedup pairs + MemoryStore adapter for 7 backends." Recon flipped both halves: the 3 pairs were actually 2 namespace-collision pairs + 1 filename-collision-only pair, and the `MemoryStore` adapter already existed with 4 of 9 stores conforming and 5 intentionally separate.

**Rule.** When picking a wedge from a REVIEW ledger that was authored as a sweep summary, dedicate the first ~15min of the ship to recon. Verify (a) the actual file structure matches what the ledger described, (b) the suggested fix is the right shape, and (c) the work isn't already partly done. The cost of recon is small; the cost of executing the wrong refactor for hours is enormous.

**Anti-pattern.** Treating a ledger entry as a directive ("the spec says merge these stores, so merge them"). Ledger entries are best-effort sweep summaries; they may be wrong about scope, framing, or even existence of the problem. The ledger is a starting point for investigation, not an authoritative work order.

---

## #L781-2 — Filename collisions and class-name collisions need separate ledger fields

**Signal.** REVIEW ledger phrasing "3 `chip-registry.ts` files" lumped together (a) class duplicates needing merge with (b) filename collisions needing rename. A two-minute recon revealed `src/chips/chip-registry.ts` exports `class ChipRegistry` and `src/chipset/teams/chip-registry.ts` exports `class EngineRegistry`. Two different classes; one bad filename. The fix shape differs by ~10× in size: merge is complex; filename rename is one `git mv`.

**Rule.** Future REVIEW ledger sweeps that flag duplicate `Store`/`Registry`/`Manager` files should report BOTH `filename_dups: ['foo.ts × 3']` AND `class_name_dups: [{name: 'FooRegistry', count: 2, paths: [...]}]`. The two are independent failure modes with different fixes.

**Anti-pattern.** Reporting only the filename count when the class names differ. The reader is misled into estimating fix complexity at merge-scale when the actual work is rename-scale.

---

## #L781-3 — Interface-conformance audits should report "intentional non-conformance" as a distinct verdict

**Signal.** REVIEW ledger said "extract `MemoryStore` adapter for 7 memory backends" as if those backends were missing conformance. In fact 4 already conformed, and the other 5 served fundamentally different roles (different record types, different lifecycles). The audit's outcome was 0 widening + 5 doc comments stating "Role: NOT a `MemoryStore` tier."

**Rule.** When auditing an interface for conformance across N candidate types, the verdict for each candidate should be one of: (a) ALREADY CONFORMS, (b) SHOULD CONFORM (gap to close), (c) INTENTIONALLY DIFFERENT ROLE (doc the reason at the type site). The third verdict is just as load-bearing as the second — it prevents future audits from re-flagging the same false positive.

**Anti-pattern.** Treating non-conformance as always a gap to close. Some types share a name suffix (`Store`) but serve fundamentally different roles; forcing them into a single adapter interface degrades both the interface and the types.
