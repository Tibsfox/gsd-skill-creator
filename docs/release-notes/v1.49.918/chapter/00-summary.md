# v1.49.918 — Summary

**Memory Arena resume.** The `memory_arena` subsystem, parked at M13 since the artemis-ii close, is resumed across three slices (M14–M16) sourced from audit item T3.2. No NASA degree advance (holds at 1.178). The campaign's defining finding: three of the four roadmap threads were already built — kernel launch, benchmarks, the cgroup enforcer, and the migration proof all existed — so the genuine work was *generalize / consume / verify*, exactly the "observation-bounded, not architecturally blocking" picture the v784 audit predicted.

## The three slices

### M14 — GPU compute

Where M6/M12/M13 built the VRAM *tier* (device memory, pinned staging, multi-GPU topology, launch *config*), M14 makes the arena a general GPU-compute substrate. `VramContext::compile_cuda` compiles high-level CUDA C to PTX at runtime via NVRTC (the previously-unused half of the cudarc `nvrtc` feature), so kernels are authored as readable C rather than hand-assembled PTX. A generic in-place launch path (`launch_inplace_u8` + `VramPool::apply_kernel`) applies any `(u8*, u32)` kernel to arena VRAM chunks. And `verify_against_host` → `IntegrityReport` turns the built-but-unconsumed GPU checksum kernel into an integrity verdict. The headline test launches an NVRTC-compiled checksum kernel and the hand-written PTX kernel over identical input and asserts the results are **byte-identical** — runtime compilation provably matches the baseline. +8 cuda-gated tests (365 → 373 cuda).

### M15 — opt-in cgroup memory ceiling

`CgroupEnforcer` (cgroup v2 `memory.max` budget — 8 GiB start, 4 GiB grow steps, 48 GiB hard cap) existed and was unit-tested but had no caller. M15 wires it into `ArenaSet` as an **opt-in (default-off)** allocation chokepoint: a new `ArenaSet::alloc(tier, payload)` ensures cgroup headroom (growing `memory.max` in steps to the hard cap, else failing loudly with `ArenaError::CgroupError`) before delegating. The `arena_set_alloc` IPC command routes through it; behavior is unchanged when no enforcer is attached. +4 tests via mock cgroup dirs (321 → 325 no-features). CI-runnable.

### M16 — live migration + adoption proof

The session-014 roadmap's "run the migration + verify all unique names resolve" turned out to be already implemented and passing: `grove-migration-live.test.ts` migrates the real corpus into a headless in-memory `arena_set_*` store and asserts lossless migration + end-to-end name resolution. Confirmed it still holds on the **grown** corpus — the live `.grove/arena.json` is now 107 MB (14× its size when written), and all 752 namespace bindings resolve (47 agents, 313 skills, 12/12 teams). Hardened the proof: `.grove/arena.json` is a gitignored runtime artifact, so both `describe` blocks now guard with `describe.skipIf(!liveCorpusExists)` — runs and passes where the corpus exists, skips cleanly where absent (proven both directions). Mirrors the `wwwHarnessAvailable` pattern + the #10182 skip-guard discipline.

## Result

`memory_arena` Rust suite 325 no-features / 377 cuda green (+12). Main vitest suite unchanged (35,562). Three baseline docs (`docs/memory-arena/M14|M15|M16-baseline.md`). 0 new deps, 0 Cargo touches, CI build path untouched. The Rust suite is verified locally (cuda needs the RTX 4060 Ti; CI runs no `cargo test` for src-tauri — the established pattern for this subsystem); the M16 TS change is fully CI-gated.
