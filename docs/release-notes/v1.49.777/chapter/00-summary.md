> Following v1.49.776 — _Template-Pollution Cleanup Counter-Cadence_, v1.49.777 ships as Wave 1 Review BLOCKERs / Security + Correctness Counter-Cadence.

# v1.49.777 — Wave 1 Review BLOCKERs / Security + Correctness Counter-Cadence

**Shipped:** 2026-05-26
_Parse confidence: 0.50 — source `docs/release-notes/v1.49.777/README.md`_

## Summary

Counter-cadence ship #3 — closes the 4 BLOCKERs surfaced by a full-codebase risk-tier sweep. Two security: `src/learn/acquirer.ts` shell injection (8 execSync→execFileSync swaps) and `src/chipset/blitter/executor.ts` RCE-by-design surface (drop 'custom' scriptType, drop chmod 0o755, env allowlist, plug temp-dir leak). Two correctness: write-queue self-poisoning in 10 sibling JSONL stores (introduces `src/safety/write-queue.ts::serializeWrite`) and `PinnedBuffer::drop` UB in VRAM Rust code (adds `enum Backing` field). NASA degree sustains at 1.177 (no forward-cadence content). Third counter-cadence in the engine (parents: v1.49.585 + v1.49.776).

It also produced retrospective content (decisions, lessons_learned, surprises, what_could_be_better, what_worked); see `03-retrospective.md`.

5 lesson candidates extracted; see `04-lessons.md`.

---
**Prev:** [v1.49.776](../v1.49.776/00-summary.md) · _(current tip)_
