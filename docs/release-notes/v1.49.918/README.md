# v1.49.918 — Memory Arena Resume (M14–M16)

**Shipped:** 2026-05-30
**Type:** Feature (subsystem resume — Memory Arena; no NASA degree advance)
**NASA degree:** 1.178 (unchanged — 135 consecutive ships)
**Predecessor:** v1.49.917

## What shipped

Resumes the **Memory Arena** subsystem (`src-tauri/src/memory_arena/`), parked
at M13 since the artemis-ii close (2026-04-10). Sourced from the audit item
T3.2 (`.planning/AUDIT-2026-05-26-core-functions-retrospective.md`). Three
slices — and the campaign's finding was that three of the four roadmap threads
were already built, so the work was *generalize / consume / verify*, not
greenfield (validating the audit's "observation-bounded, not architecturally
blocking" framing).

1. **M14 — GPU compute.** `VramContext::compile_cuda` (NVRTC runtime CUDA-C→PTX
   compilation — the unused half of the cudarc `nvrtc` feature), a generic
   in-place launch path (`launch_inplace_u8` + `VramPool::apply_kernel`) so any
   `(u8*, u32)` kernel runs over arena VRAM chunks, and `verify_against_host` →
   `IntegrityReport` consuming the previously-unwired GPU checksum kernel as a
   verdict. The headline test proves an NVRTC-compiled kernel is byte-identical
   to the hand-written PTX baseline. Advances GAP-4 (GPU pipeline E2E) at the
   substrate layer.
2. **M15 — opt-in cgroup memory ceiling.** Wires the built-but-unconsumed
   `CgroupEnforcer` into `ArenaSet` as a default-off allocation chokepoint
   (`ArenaSet::alloc` ensures cgroup `memory.max` headroom, growing in steps to
   the hard cap, else rejects). The `arena_set_alloc` IPC routes through it.
3. **M16 — live migration + adoption proof.** Verified `migrateJsonToArenaSet`
   losslessly ingests the real 107 MB `.grove/arena.json` (752 namespace
   bindings resolve end-to-end), and hardened the existing proof with a
   corpus-absent `describe.skipIf` skip-guard (gitignored-artifact safe).

## Engine state

- NASA degree 1.178 (unchanged)
- Counter-cadence count: 18 (unchanged — this is forward feature work, not cleanup)
- Manifest: 24 domains, 149 lessons (unchanged — no new lesson)
- `memory_arena` Rust tests: 325 no-features / 377 cuda (+12: 8 M14, 4 M15)
- Main vitest suite: 35,562 (unchanged — M16 hardens an existing test, adds no count)

## Chapters

- [00-summary](chapter/00-summary.md)
- [03-retrospective](chapter/03-retrospective.md)
- [04-lessons](chapter/04-lessons.md)
- [99-context](chapter/99-context.md)
