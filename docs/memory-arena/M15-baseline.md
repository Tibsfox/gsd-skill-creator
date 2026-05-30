# M15 Baseline — Opt-in cgroup Memory Ceiling on ArenaSet

**Date:** 2026-05-30
**Branch:** dev
**Predecessor:** M14 (GPU compute)

## Overview

M15 closes a consume-axis gap: `CgroupEnforcer` (cgroup v2 `memory.max` budget —
8 GiB start, 4 GiB grow steps, 48 GiB hard cap, swap forbidden) had existed and
was fully unit-tested since the M8-era, but **nothing consumed it** — it was
built code with no caller (audit S2 shelfware). M15 wires it into `ArenaSet` as
an **opt-in (default-off)** allocation gate and routes the production IPC path
through the new chokepoint.

**Tests:** +4 (`memory_arena` no-features **321 → 325**; cuda **373 → 377**).
0 new deps, 0 Cargo touches. CI-runnable (no GPU needed).

## What landed

- `ArenaSet` gains an optional `cgroup: Option<CgroupEnforcer>` field, `None` by
  default. An ArenaSet without an enforcer never touches a cgroup control file —
  matching the project's universal opt-in posture.
- `ArenaSet::attach_cgroup_enforcer(enforcer)` — opt-in attach. The caller picks
  the target: `CgroupEnforcer::discover()` for the real process cgroup, or
  `from_path()` for a specific/mock cgroup directory.
- `ArenaSet::cgroup_state() -> Option<ArenaResult<CgroupMemoryState>>` —
  observability (`None` when no enforcer attached).
- `ArenaSet::alloc(tier, payload)` — **new cgroup-aware allocation chokepoint.**
  When an enforcer is attached it calls `ensure_headroom(payload.len())` first
  (growing `memory.max` in steps up to the hard cap); if the cap is reached with
  insufficient headroom it fails with `ArenaError::CgroupError` rather than
  letting the process drift toward an OOM kill. With no enforcer it is a thin
  pass-through to the tier pool — so existing behavior is unchanged by default.
- The `arena_set_alloc` Tauri command now routes through `ArenaSet::alloc`, so
  the enforcer is consumed on the production path (no behavior change when no
  enforcer is attached).

## Safety of enforcement (design note)

`CgroupEnforcer::ensure_headroom` *writes* the cgroup `memory.max` file when it
grows. To exercise the full grow/reject path without touching the running
process's real cgroup, all four M15 tests build a **mock cgroup directory**
(tempdir with `memory.max` / `memory.current` / `memory.swap.max`) and attach via
`from_path` — the same pattern as the existing `cgroup_tests`. Production callers
opt in deliberately; tests never do `discover()`.

## Tests

| Test | Asserts |
|---|---|
| `alloc_without_cgroup_enforcer_is_passthrough` | default-off: no enforcer, `cgroup_state()` is `None`, alloc succeeds |
| `alloc_with_cgroup_enforcer_passes_when_headroom` | ample headroom → alloc ok, `memory.max` unchanged |
| `alloc_with_cgroup_enforcer_grows_limit_under_pressure` | low headroom → `memory.max` grows by exactly one 4 GiB step |
| `alloc_with_cgroup_enforcer_rejects_at_hard_cap` | at hard cap with no headroom → `ArenaError::CgroupError` |

## Re-run

```bash
cargo test --manifest-path src-tauri/Cargo.toml --lib memory_arena   # no GPU needed
```
