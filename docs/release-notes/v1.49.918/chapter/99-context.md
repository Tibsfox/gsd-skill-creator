# v1.49.918 — Context

## Milestone metadata

- **Version:** v1.49.918
- **Type:** Feature (Memory Arena subsystem resume — M14–M16)
- **Predecessor:** v1.49.917
- **NASA degree:** 1.178 (unchanged)
- **Counter-cadence count:** 18 (unchanged)
- **Source:** audit item T3.2 (`.planning/AUDIT-2026-05-26-core-functions-retrospective.md`)

## Files changed

- `src-tauri/src/memory_arena/vram.rs` — M14: `compile_cuda` (NVRTC), `launch_inplace_u8`, `VramPool::apply_kernel`, `verify_against_host` + `IntegrityReport`
- `src-tauri/src/memory_arena/pool.rs` — M15: opt-in `cgroup` field + `attach_cgroup_enforcer` / `cgroup_state` + cgroup-aware `ArenaSet::alloc` chokepoint
- `src-tauri/src/commands/memory_arena.rs` — M15: `arena_set_alloc` routes through `ArenaSet::alloc`
- `src-tauri/src/memory_arena/tests.rs` — +8 M14 cuda tests, +4 M15 cgroup tests
- `src-tauri/src/memory_arena/README.md` — slice history M14/M15/M16 + module layout
- `src/memory/__tests__/grove-migration-live.test.ts` — M16: `describe.skipIf` corpus-absent skip-guard
- `docs/memory-arena/M14-baseline.md`, `M15-baseline.md`, `M16-baseline.md` — new slice baselines

## Commits

- `ae201f650` feat(memory-arena): m14 gpu compute (nvrtc compile, launch, integrity)
- `ad5f74fef` feat(memory-arena): m15 opt-in cgroup memory ceiling on arenaset
- `81cdd4b4f` test(memory-arena): m16 migration proof skip-guard + adoption verify
- (+ this `chore(release): v1.49.918` commit)

## Test posture

- `memory_arena` Rust: **325** no-features / **377** cuda (+12: 8 M14, 4 M15). Verified locally — CI runs no `cargo test` for src-tauri; cuda needs the RTX 4060 Ti. Established pattern for this subsystem.
- Main vitest suite: **35,562** (unchanged — M16 hardens an existing test, adds no count). The M16 skip-guard is CI-gated.
- Live migration proof (`grove-migration-live.test.ts`): 17/17 against the real 107 MB corpus; skips cleanly when absent.

## T14 ship sequence (operator-only authorization)

Per Lesson #10191 (atomic directive state) + #10184 (single-step main FF) +
#10197 (STORY-gate post-bump-version). Canonical sequence at
`docs/T14-SHIP-SEQUENCE.md`.

Milestone-specific notes:
- No `www/` change → no FTP sync, no chapter-gen needed.
- GH release publish remains batch-deferred (since v886).
- Operator retains the G3 (dev→main) gate.

## Engine state at close

- NASA degree 1.178 (135 consecutive ships)
- Counter-cadence count 18
- Manifest: 24 domains, 149 lessons
- KNOWN_UNWIRED Process/Egress/Loader: 0/0/0
- Memory Arena: M16 (resumed past M13); remaining non-goal = datatypes plugin pattern only
