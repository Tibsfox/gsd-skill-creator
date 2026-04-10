//! Criterion benchmark harness for the memory_arena module.
//!
//! Plan 07 / Deliverable D4 of memory-arena-m1.
//!
//! This harness establishes the M1 baseline numbers. Every future tuning
//! decision in the memory subsystem is measured against these numbers — see
//! `docs/memory-arena/M1-baseline.md` for the captured output.
//!
//! Bench groups:
//!
//! - **alloc** — `alloc_chunk_small` (1 KiB payload) and `alloc_chunk_large`
//!   (1 MiB payload). Single Hot tier, heap-backed Arena.
//! - **get** — `get_chunk_hot` against a pre-populated 1000-chunk arena.
//! - **touch** — `touch_chunk` round-robin over 1000 chunks (exercises the
//!   LRU move-to-front hot path wired in Plan 03).
//! - **warm_start** — `WarmStart::open` wall-clock time against mmap-backed
//!   ArenaSets of 1k and 10k chunks. The 100k case lives in its own
//!   `warm_start_big` group with `sample_size(10)` because each iteration
//!   is inherently slow.
//! - **checkpoint** — `write_checkpoint` throughput against a 1000-chunk
//!   arena.
//! - **journal** — `append_alloc` throughput + `replay_into` rate over
//!   1000 ops.
//!
//! Re-run with: `cd src-tauri && cargo bench --bench arena_bench`

use std::time::Duration;

use criterion::{
    black_box, criterion_group, criterion_main, BenchmarkId, Criterion, Throughput,
};
use tempfile::tempdir;

use gsd_os_lib::memory_arena::{
    allocator::{
        BuddyAllocator, ChunkAllocator, FixedSlotAllocator, SlabAllocator, SlabConfig,
        TlsfAllocator, TlsfConfig,
    },
    persistence::{replay_into, write_checkpoint, JournalReader, JournalWriter},
    pool::{ArenaSet, ArenaSetConfig, CrossfadeHandle, EvictionKind, PoolSpec, TierPolicy},
    types::{AllocatorSelector, ArenaConfig, ChunkId, TierKind},
    warm_start::{InMemoryColdSource, WarmStart, WarmStartConfig},
    Arena,
};

// ===== helpers =====================================================

/// Config for the small-payload alloc bench: 4 KiB slots, 1 KiB payload fits.
fn config_small() -> ArenaConfig {
    ArenaConfig::test()
}

/// Config for the large-payload alloc bench: 2 MiB slots, up to 1 MiB payload.
fn config_large() -> ArenaConfig {
    ArenaConfig {
        chunk_size: 2 * 1024 * 1024,
        min_chunk_size: 64,
        max_chunk_size: 4 * 1024 * 1024,
        default_policies: ArenaConfig::default().default_policies,
    }
}

/// Unlimited TierPolicy (no max_chunks cap) used for ArenaSet benches.
fn unlimited_policy() -> TierPolicy {
    TierPolicy {
        max_chunks: 0,
        eviction: EvictionKind::Lru,
        promote_after_hits: 0,
        demote_after_idle_ns: 0,
        demote_cooldown_ns: 0,
        promote_cooldown_ns: 0,
    }
}

/// PoolSpec for a Hot tier with N slots, using ArenaConfig::test() sizing.
fn hot_spec(num_slots: usize) -> PoolSpec {
    PoolSpec {
        tier: TierKind::Hot,
        chunk_size: ArenaConfig::test().chunk_size,
        num_slots,
        policy: unlimited_policy(),
        allocator: AllocatorSelector::FixedSlot,
    }
}

/// Build a pre-populated Arena with `n` small chunks for get/touch benches.
fn prefilled_arena(n: usize) -> Arena {
    let mut arena = Arena::new(config_small(), n).expect("alloc arena");
    for i in 0..n {
        let payload = vec![i as u8; 64];
        arena
            .alloc_chunk(TierKind::Hot, payload)
            .expect("prefill alloc");
    }
    arena
}

// ===== bench: alloc ================================================

fn bench_alloc(c: &mut Criterion) {
    let mut group = c.benchmark_group("alloc");

    // Small: 1 KiB payload, single Hot tier, ArenaConfig::test().
    // iter_batched with a fresh arena per iteration so we're measuring
    // steady-state alloc cost, not arena growth.
    group.throughput(Throughput::Bytes(1024));
    group.bench_function("alloc_chunk_small_1kib", |b| {
        b.iter_batched(
            || Arena::new(config_small(), 1).expect("fresh arena"),
            |mut arena| {
                let payload = vec![0xAA; 1024];
                let id = arena
                    .alloc_chunk(TierKind::Hot, black_box(payload))
                    .expect("alloc");
                black_box(id);
            },
            criterion::BatchSize::SmallInput,
        );
    });

    // Large: 1 MiB payload, larger config.
    group.throughput(Throughput::Bytes(1024 * 1024));
    group.bench_function("alloc_chunk_large_1mib", |b| {
        b.iter_batched(
            || Arena::new(config_large(), 1).expect("fresh arena"),
            |mut arena| {
                let payload = vec![0xBB; 1024 * 1024];
                let id = arena
                    .alloc_chunk(TierKind::Hot, black_box(payload))
                    .expect("alloc");
                black_box(id);
            },
            criterion::BatchSize::SmallInput,
        );
    });

    group.finish();
}

// ===== bench: get ==================================================

fn bench_get(c: &mut Criterion) {
    let mut group = c.benchmark_group("get");
    group.throughput(Throughput::Elements(1));

    let arena = prefilled_arena(1000);
    group.bench_function("get_chunk_hot", |b| {
        let mut idx: u64 = 1;
        b.iter(|| {
            let id = ChunkId::new(idx);
            let chunk = arena.get_chunk(black_box(id)).expect("get");
            black_box(chunk);
            idx += 1;
            if idx > 1000 {
                idx = 1;
            }
        });
    });

    group.finish();
}

// ===== bench: get_zero_copy_comparison ==============================
//
// Compare the zero-copy hot path (get_chunk_hot) vs the full path (get_chunk).
// This isolates the performance improvement from returning a slice vs a full Chunk.
//
// Baseline (2026-04-10, 1000 chunks, RTX 4060 Ti host):
//   get_chunk (full):           111.29 ns  — baseline
//   get_chunk_hot (zero-copy):   48.76 ns  — 2.28x faster
//   get_chunk_hot_with_header:   52.24 ns  — 2.13x faster

fn bench_get_zero_copy_comparison(c: &mut Criterion) {
    let mut group = c.benchmark_group("get_zero_copy_comparison");
    group.throughput(Throughput::Elements(1));

    let arena = prefilled_arena(1000);

    // Full path: get_chunk() returns the entire Chunk struct with header + metadata.
    group.bench_function("get_chunk_full", |b| {
        let mut idx: u64 = 1;
        b.iter(|| {
            let id = ChunkId::new(idx);
            let chunk = arena.get_chunk(black_box(id)).expect("get_chunk");
            black_box(chunk);
            idx += 1;
            if idx > 1000 {
                idx = 1;
            }
        });
    });

    // Zero-copy hot path: get_chunk_hot() returns only the payload slice.
    group.bench_function("get_chunk_hot_zerocopy", |b| {
        let mut idx: u64 = 1;
        b.iter(|| {
            let id = ChunkId::new(idx);
            let payload = arena.get_chunk_hot(black_box(id)).expect("get_hot");
            black_box(payload);
            idx += 1;
            if idx > 1000 {
                idx = 1;
            }
        });
    });

    // Header + payload variant: get_chunk_hot_with_header() for callers that need metadata.
    group.bench_function("get_chunk_hot_with_header", |b| {
        let mut idx: u64 = 1;
        b.iter(|| {
            let id = ChunkId::new(idx);
            let (header, payload) = arena.get_chunk_hot_with_header(black_box(id)).expect("get_with_header");
            black_box((header, payload));
            idx += 1;
            if idx > 1000 {
                idx = 1;
            }
        });
    });

    group.finish();
}

// ===== bench: touch ================================================

fn bench_touch(c: &mut Criterion) {
    let mut group = c.benchmark_group("touch");
    group.throughput(Throughput::Elements(1000));

    group.bench_function("touch_chunk_roundrobin_1k", |b| {
        b.iter_batched(
            || prefilled_arena(1000),
            |mut arena| {
                // Touch every chunk once. LRU move-to-front runs per call.
                for idx in 1u64..=1000 {
                    arena.touch_chunk(ChunkId::new(idx)).expect("touch");
                }
            },
            criterion::BatchSize::LargeInput,
        );
    });

    group.finish();
}

// ===== bench: warm_start ===========================================
//
// M2 note: `WarmStart::open` is now lazy by default (see
// memory_arena/warm_start.rs). The `warm_start` / `warm_start_big`
// groups below now measure the **lazy** path — the new M2 default.
// The companion `warm_start_eager` / `warm_start_eager_big` groups
// measure the M1-equivalent eager path explicitly for side-by-side
// comparison against `docs/memory-arena/M1-baseline.md`.
//
// The `validate_chunk_lazy` group measures the cost of explicit
// payload validation after a lazy open — this is the "what does the
// lazy default defer?" cost.

/// Helper: build + fill an ArenaSet tempdir with `n` Hot chunks, then
/// flush and drop it, returning the `TempDir` handle so the warm-start
/// bench iteration can reopen it.
fn make_warm_start_tempdir(n: usize) -> tempfile::TempDir {
    let tmp = tempdir().expect("tempdir");
    let cfg = ArenaSetConfig::new(tmp.path()).with_pool(hot_spec(n));
    {
        let mut set = ArenaSet::create(cfg).expect("create");
        for i in 0..n {
            set.pool_mut(TierKind::Hot)
                .unwrap()
                .alloc(vec![(i as u8).wrapping_mul(7); 64])
                .expect("alloc");
        }
        set.flush().expect("flush");
    }
    tmp
}

fn bench_warm_start(c: &mut Criterion) {
    let mut group = c.benchmark_group("warm_start");
    // Warm-start scales with chunk count — give it breathing room.
    group.measurement_time(Duration::from_secs(10));

    for &n in &[1000usize, 10_000usize] {
        group.throughput(Throughput::Elements(n as u64));
        group.bench_with_input(BenchmarkId::from_parameter(n), &n, |b, &n| {
            b.iter_batched(
                || make_warm_start_tempdir(n),
                |tmp| {
                    let cold = InMemoryColdSource::new();
                    // Lazy default (M2). See bench_warm_start_eager for
                    // the M1-equivalent path.
                    let (set, report) =
                        WarmStart::open(tmp.path(), &cold).expect("warm start");
                    black_box(set);
                    black_box(report);
                },
                criterion::BatchSize::PerIteration,
            );
        });
    }

    group.finish();

    // 100k case gets its own group with sample_size reduced per the plan.
    let mut big = c.benchmark_group("warm_start_big");
    big.sample_size(10);
    big.measurement_time(Duration::from_secs(30));
    big.throughput(Throughput::Elements(100_000));
    big.bench_function("warm_start_100k", |b| {
        b.iter_batched(
            || make_warm_start_tempdir(100_000),
            |tmp| {
                let cold = InMemoryColdSource::new();
                // Lazy default — this is the M2 headline bench.
                let (set, report) =
                    WarmStart::open(tmp.path(), &cold).expect("warm start");
                black_box(set);
                black_box(report);
            },
            criterion::BatchSize::PerIteration,
        );
    });
    big.finish();
}

// ===== bench: warm_start_eager (M1-equivalent path for side-by-side) =====

fn bench_warm_start_eager(c: &mut Criterion) {
    let mut group = c.benchmark_group("warm_start_eager");
    group.measurement_time(Duration::from_secs(10));

    for &n in &[1000usize, 10_000usize] {
        group.throughput(Throughput::Elements(n as u64));
        group.bench_with_input(BenchmarkId::from_parameter(n), &n, |b, &n| {
            b.iter_batched(
                || make_warm_start_tempdir(n),
                |tmp| {
                    let cold = InMemoryColdSource::new();
                    // Explicit eager path — matches M1's baseline behavior.
                    let (set, report) =
                        WarmStart::open_eager(tmp.path(), &cold)
                            .expect("warm start eager");
                    black_box(set);
                    black_box(report);
                },
                criterion::BatchSize::PerIteration,
            );
        });
    }

    group.finish();

    let mut big = c.benchmark_group("warm_start_eager_big");
    big.sample_size(10);
    big.measurement_time(Duration::from_secs(30));
    big.throughput(Throughput::Elements(100_000));
    big.bench_function("warm_start_eager_100k", |b| {
        b.iter_batched(
            || make_warm_start_tempdir(100_000),
            |tmp| {
                let cold = InMemoryColdSource::new();
                let (set, report) =
                    WarmStart::open_eager(tmp.path(), &cold)
                        .expect("warm start eager");
                black_box(set);
                black_box(report);
            },
            criterion::BatchSize::PerIteration,
        );
    });
    big.finish();
}

// ===== bench: validate_chunk (M2 on-demand validation cost) ===============

fn bench_validate_chunk(c: &mut Criterion) {
    let mut group = c.benchmark_group("validate_chunk_lazy");
    // Bench: alloc 1000 chunks, drop, lazy-open the arena, then measure
    // the cost of validating every chunk via `Arena::validate_chunk`.
    // This is the "what does lazy defer?" number — what callers pay if
    // they want the same guarantee the eager path gives by default.
    group.measurement_time(Duration::from_secs(10));
    group.throughput(Throughput::Elements(1000));
    group.bench_function("validate_chunk_after_lazy_open_1k", |b| {
        b.iter_batched(
            || {
                let tmp = tempdir().expect("tempdir");
                let cfg = ArenaSetConfig::new(tmp.path())
                    .with_pool(hot_spec(1000));
                let ids: Vec<ChunkId> = {
                    let mut set = ArenaSet::create(cfg).expect("create");
                    let pool = set.pool_mut(TierKind::Hot).unwrap();
                    let mut ids = Vec::with_capacity(1000);
                    for i in 0..1000 {
                        ids.push(
                            pool.alloc(vec![(i as u8).wrapping_mul(7); 64])
                                .expect("alloc"),
                        );
                    }
                    set.flush().expect("flush");
                    ids
                };

                // Lazy reopen.
                let cold = InMemoryColdSource::new();
                let (set, _report, _stats) = WarmStart::open_with_config(
                    tmp.path(),
                    &cold,
                    WarmStartConfig::default(),
                )
                .expect("lazy open");
                (set, ids, tmp)
            },
            |(set, ids, _tmp)| {
                let pool = set.pool(TierKind::Hot).expect("hot pool");
                for id in &ids {
                    pool.arena()
                        .validate_chunk(*id)
                        .expect("validate_chunk ok");
                }
                black_box(ids);
            },
            criterion::BatchSize::PerIteration,
        );
    });
    group.finish();
}

// ===== bench: checkpoint ===========================================

fn bench_checkpoint(c: &mut Criterion) {
    let mut group = c.benchmark_group("checkpoint");
    group.throughput(Throughput::Elements(1000));

    group.bench_function("checkpoint_write_1k", |b| {
        b.iter_batched(
            || {
                let arena = prefilled_arena(1000);
                let tmp = tempdir().expect("tempdir");
                let path = tmp.path().join("ckpt.bin");
                (arena, tmp, path)
            },
            |(arena, _tmp, path)| {
                write_checkpoint(&arena, black_box(&path)).expect("checkpoint");
            },
            criterion::BatchSize::PerIteration,
        );
    });

    group.finish();
}

// ===== bench: journal ==============================================

fn bench_journal(c: &mut Criterion) {
    let mut group = c.benchmark_group("journal");
    group.throughput(Throughput::Elements(1000));

    // Append throughput: 1000 alloc ops appended to a fresh journal.
    group.bench_function("journal_append_1k", |b| {
        b.iter_batched(
            || {
                // Pre-build the chunk bytes once per iteration so the bench
                // measures journal I/O, not chunk serialization.
                let source = prefilled_arena(1000);
                let chunk_bytes: Vec<(ChunkId, Vec<u8>)> = (1u64..=1000)
                    .map(|id| {
                        let chunk = source
                            .get_chunk(ChunkId::new(id))
                            .expect("source get");
                        (ChunkId::new(id), chunk.serialize())
                    })
                    .collect();
                let tmp = tempdir().expect("tempdir");
                let path = tmp.path().join("journal.bin");
                let writer = JournalWriter::open(&path).expect("open writer");
                (writer, chunk_bytes, tmp)
            },
            |(mut writer, chunk_bytes, _tmp)| {
                for (id, bytes) in &chunk_bytes {
                    writer
                        .append_alloc(black_box(*id), black_box(bytes))
                        .expect("append_alloc");
                }
                writer.flush().expect("flush");
            },
            criterion::BatchSize::PerIteration,
        );
    });

    // Replay rate: pre-write 1000 ops to a journal, then replay_into an arena.
    group.bench_function("journal_replay_1k", |b| {
        b.iter_batched(
            || {
                let tmp = tempdir().expect("tempdir");
                let journal_path = tmp.path().join("journal.bin");

                // Pre-populate the journal file.
                let source = prefilled_arena(1000);
                {
                    let mut writer = JournalWriter::open(&journal_path)
                        .expect("writer open");
                    for id in 1u64..=1000 {
                        let chunk = source
                            .get_chunk(ChunkId::new(id))
                            .expect("source get");
                        writer
                            .append_alloc(ChunkId::new(id), &chunk.serialize())
                            .expect("append_alloc");
                    }
                    writer.flush().expect("flush");
                }

                let target = Arena::new(config_small(), 1000).expect("target arena");
                (target, journal_path, tmp)
            },
            |(mut target, path, _tmp)| {
                let reader = JournalReader::open(black_box(&path)).expect("reader open");
                let n = replay_into(&mut target, reader).expect("replay");
                black_box(n);
            },
            criterion::BatchSize::PerIteration,
        );
    });

    group.finish();
}

// ===== bench: demote_crossfade (M3 Plan 06) ========================

/// Build a 2-pool ArenaSet with Hot (source) + Warm (target) tiers. Each
/// pool is sized for `num_slots` chunks of up to `slot_size` bytes. Used
/// by the M3 demote crossfade benches.
fn two_pool_set(
    root: &std::path::Path,
    num_slots: usize,
    slot_size: u64,
) -> ArenaSet {
    let config = ArenaConfig {
        chunk_size: slot_size,
        min_chunk_size: 64,
        max_chunk_size: slot_size * 4,
        default_policies: ArenaConfig::default().default_policies,
    };
    let _ = config; // keep `config` around for future reuse if needed
    let hot = PoolSpec {
        tier: TierKind::Hot,
        chunk_size: slot_size,
        num_slots,
        policy: unlimited_policy(),
        allocator: AllocatorSelector::FixedSlot,
    };
    let warm = PoolSpec {
        tier: TierKind::Warm,
        chunk_size: slot_size,
        num_slots,
        policy: unlimited_policy(),
        allocator: AllocatorSelector::FixedSlot,
    };
    ArenaSet::create(
        ArenaSetConfig::new(root)
            .with_pool(hot)
            .with_pool(warm),
    )
    .expect("two-pool ArenaSet create")
}

fn bench_demote_crossfade(c: &mut Criterion) {
    let mut group = c.benchmark_group("demote_crossfade");
    group.measurement_time(Duration::from_secs(5));

    // ----- begin_demote: 1 KiB payload (small slots) ------------------
    //
    // Per-iter setup: build a fresh ArenaSet with one Hot chunk holding
    // a 1 KiB payload. The iter body times just `begin_demote` on that
    // pre-allocated source. Fresh setup per iteration because begin_demote
    // is one-shot (a second call on the same source hits AlreadyFading).
    group.throughput(Throughput::Bytes(1024));
    group.bench_function("begin_1kib", |b| {
        b.iter_batched(
            || {
                let tmp = tempdir().expect("tempdir");
                let mut set = two_pool_set(tmp.path(), 4, 4 * 1024);
                let source = set
                    .pool_mut(TierKind::Hot)
                    .expect("hot")
                    .alloc(vec![0xAB; 1024])
                    .expect("alloc source");
                (set, source, tmp)
            },
            |(mut set, source, _tmp)| {
                let handle = set
                    .begin_demote(TierKind::Hot, black_box(source), TierKind::Warm)
                    .expect("begin");
                black_box(handle);
            },
            criterion::BatchSize::PerIteration,
        );
    });

    // ----- begin_demote: 1 MiB payload (large slots) ------------------
    group.throughput(Throughput::Bytes(1024 * 1024));
    group.bench_function("begin_1mib", |b| {
        b.iter_batched(
            || {
                let tmp = tempdir().expect("tempdir");
                let mut set = two_pool_set(tmp.path(), 4, 2 * 1024 * 1024);
                let source = set
                    .pool_mut(TierKind::Hot)
                    .expect("hot")
                    .alloc(vec![0xCD; 1024 * 1024])
                    .expect("alloc source");
                (set, source, tmp)
            },
            |(mut set, source, _tmp)| {
                let handle = set
                    .begin_demote(TierKind::Hot, black_box(source), TierKind::Warm)
                    .expect("begin");
                black_box(handle);
            },
            criterion::BatchSize::PerIteration,
        );
    });

    // ----- complete_demote: 1 KiB ------------------------------------
    //
    // Per-iter setup: alloc source and begin_demote so the handle is
    // ready. The iter body times just `complete_demote(handle)`.
    group.throughput(Throughput::Bytes(1024));
    group.bench_function("complete_1kib", |b| {
        b.iter_batched(
            || {
                let tmp = tempdir().expect("tempdir");
                let mut set = two_pool_set(tmp.path(), 4, 4 * 1024);
                let source = set
                    .pool_mut(TierKind::Hot)
                    .expect("hot")
                    .alloc(vec![0xEF; 1024])
                    .expect("alloc source");
                let handle: CrossfadeHandle = set
                    .begin_demote(TierKind::Hot, source, TierKind::Warm)
                    .expect("begin");
                (set, handle, tmp)
            },
            |(mut set, handle, _tmp)| {
                let canonical = set
                    .complete_demote(black_box(handle))
                    .expect("complete");
                black_box(canonical);
            },
            criterion::BatchSize::PerIteration,
        );
    });

    // ----- complete_demote: 1 MiB ------------------------------------
    group.throughput(Throughput::Bytes(1024 * 1024));
    group.bench_function("complete_1mib", |b| {
        b.iter_batched(
            || {
                let tmp = tempdir().expect("tempdir");
                let mut set = two_pool_set(tmp.path(), 4, 2 * 1024 * 1024);
                let source = set
                    .pool_mut(TierKind::Hot)
                    .expect("hot")
                    .alloc(vec![0x12; 1024 * 1024])
                    .expect("alloc source");
                let handle: CrossfadeHandle = set
                    .begin_demote(TierKind::Hot, source, TierKind::Warm)
                    .expect("begin");
                (set, handle, tmp)
            },
            |(mut set, handle, _tmp)| {
                let canonical = set
                    .complete_demote(black_box(handle))
                    .expect("complete");
                black_box(canonical);
            },
            criterion::BatchSize::PerIteration,
        );
    });

    // ----- end-to-end: begin + complete, 1 KiB -----------------------
    //
    // Times the full `begin_demote` → `complete_demote` pipeline. This
    // is the realistic per-crossfade latency for the caller.
    group.throughput(Throughput::Bytes(1024));
    group.bench_function("begin_complete_1kib", |b| {
        b.iter_batched(
            || {
                let tmp = tempdir().expect("tempdir");
                let mut set = two_pool_set(tmp.path(), 4, 4 * 1024);
                let source = set
                    .pool_mut(TierKind::Hot)
                    .expect("hot")
                    .alloc(vec![0x34; 1024])
                    .expect("alloc source");
                (set, source, tmp)
            },
            |(mut set, source, _tmp)| {
                let handle = set
                    .begin_demote(TierKind::Hot, black_box(source), TierKind::Warm)
                    .expect("begin");
                let canonical = set.complete_demote(handle).expect("complete");
                black_box(canonical);
            },
            criterion::BatchSize::PerIteration,
        );
    });

    group.finish();
}

// ===== bench: hysteresis (M3 Plan 06) ==============================

fn bench_hysteresis(c: &mut Criterion) {
    let mut group = c.benchmark_group("hysteresis");
    group.measurement_time(Duration::from_secs(5));

    // Per-iter setup: build a 2-pool set with a 1-second Warm cooldown,
    // run a full demote cycle so the target has last_demote_ns stamped,
    // then ask `begin_demote` to re-demote the target back to Hot — it
    // should hit the cooldown and return HysteresisCooldown. The iter
    // body measures how cheap the rejection path is.
    //
    // We use the real clock here (not the test-only thread-local). The
    // whole iter-body is a single begin_demote call that short-circuits
    // on the cooldown check, so wall-clock elapsed between the setup's
    // complete_demote and the iter's begin_demote is always << 1 second.
    group.bench_function("rejects_cooldown_1k", |b| {
        b.iter_batched(
            || {
                let tmp = tempdir().expect("tempdir");
                let hot_spec = PoolSpec {
                    tier: TierKind::Hot,
                    chunk_size: ArenaConfig::test().chunk_size,
                    num_slots: 4,
                    policy: TierPolicy {
                        max_chunks: 0,
                        eviction: EvictionKind::Lru,
                        promote_after_hits: 0,
                        demote_after_idle_ns: 0,
                        // Hot has no cooldown — lets us do the initial
                        // demote without tripping hysteresis.
                        demote_cooldown_ns: 0,
                        promote_cooldown_ns: 0,
                    },
                    allocator: AllocatorSelector::FixedSlot,
                };
                let warm_spec = PoolSpec {
                    tier: TierKind::Warm,
                    chunk_size: ArenaConfig::test().chunk_size,
                    num_slots: 4,
                    policy: TierPolicy {
                        max_chunks: 0,
                        eviction: EvictionKind::Lru,
                        promote_after_hits: 0,
                        demote_after_idle_ns: 0,
                        // 1-second cooldown — guaranteed to trigger
                        // since the iter body runs in microseconds.
                        demote_cooldown_ns: 1_000_000_000,
                        promote_cooldown_ns: 0,
                    },
                    allocator: AllocatorSelector::FixedSlot,
                };
                let mut set = ArenaSet::create(
                    ArenaSetConfig::new(tmp.path())
                        .with_pool(hot_spec)
                        .with_pool(warm_spec),
                )
                .expect("create");
                let source = set
                    .pool_mut(TierKind::Hot)
                    .expect("hot")
                    .alloc(vec![0x56; 1024])
                    .expect("alloc");
                let handle = set
                    .begin_demote(TierKind::Hot, source, TierKind::Warm)
                    .expect("begin");
                let target = set.complete_demote(handle).expect("complete");
                (set, target, tmp)
            },
            |(mut set, target, _tmp)| {
                // This call MUST be rejected with HysteresisCooldown.
                // The iter body measures the cost of that rejection.
                let err = set
                    .begin_demote(TierKind::Warm, black_box(target), TierKind::Hot)
                    .expect_err("cooldown must reject");
                black_box(err);
            },
            criterion::BatchSize::PerIteration,
        );
    });

    group.finish();
}

// ===== bench: promote_crossfade (M4 Plan 05) =========================

fn bench_promote_crossfade(c: &mut Criterion) {
    let mut group = c.benchmark_group("promote_crossfade");
    group.measurement_time(Duration::from_secs(5));

    // ----- begin_promote: 1 KiB payload (small slots) ------------------
    group.throughput(Throughput::Bytes(1024));
    group.bench_function("begin_1kib", |b| {
        b.iter_batched(
            || {
                let tmp = tempdir().expect("tempdir");
                let mut set = two_pool_set(tmp.path(), 4, 4 * 1024);
                let source = set
                    .pool_mut(TierKind::Warm)
                    .expect("warm")
                    .alloc(vec![0xAB; 1024])
                    .expect("alloc source");
                (set, source, tmp)
            },
            |(mut set, source, _tmp)| {
                let handle = set
                    .begin_promote(TierKind::Warm, black_box(source), TierKind::Hot)
                    .expect("begin");
                black_box(handle);
            },
            criterion::BatchSize::PerIteration,
        );
    });

    // ----- begin_promote: 1 MiB payload (large slots) ------------------
    group.throughput(Throughput::Bytes(1024 * 1024));
    group.bench_function("begin_1mib", |b| {
        b.iter_batched(
            || {
                let tmp = tempdir().expect("tempdir");
                let mut set = two_pool_set(tmp.path(), 4, 2 * 1024 * 1024);
                let source = set
                    .pool_mut(TierKind::Warm)
                    .expect("warm")
                    .alloc(vec![0xCD; 1024 * 1024])
                    .expect("alloc source");
                (set, source, tmp)
            },
            |(mut set, source, _tmp)| {
                let handle = set
                    .begin_promote(TierKind::Warm, black_box(source), TierKind::Hot)
                    .expect("begin");
                black_box(handle);
            },
            criterion::BatchSize::PerIteration,
        );
    });

    // ----- complete_promote: 1 KiB ------------------------------------
    group.throughput(Throughput::Bytes(1024));
    group.bench_function("complete_1kib", |b| {
        b.iter_batched(
            || {
                let tmp = tempdir().expect("tempdir");
                let mut set = two_pool_set(tmp.path(), 4, 4 * 1024);
                let source = set
                    .pool_mut(TierKind::Warm)
                    .expect("warm")
                    .alloc(vec![0xEF; 1024])
                    .expect("alloc source");
                let handle = set
                    .begin_promote(TierKind::Warm, source, TierKind::Hot)
                    .expect("begin");
                (set, handle, tmp)
            },
            |(mut set, handle, _tmp)| {
                let canonical = set
                    .complete_promote(black_box(handle))
                    .expect("complete");
                black_box(canonical);
            },
            criterion::BatchSize::PerIteration,
        );
    });

    // ----- complete_promote: 1 MiB ------------------------------------
    group.throughput(Throughput::Bytes(1024 * 1024));
    group.bench_function("complete_1mib", |b| {
        b.iter_batched(
            || {
                let tmp = tempdir().expect("tempdir");
                let mut set = two_pool_set(tmp.path(), 4, 2 * 1024 * 1024);
                let source = set
                    .pool_mut(TierKind::Warm)
                    .expect("warm")
                    .alloc(vec![0x12; 1024 * 1024])
                    .expect("alloc source");
                let handle = set
                    .begin_promote(TierKind::Warm, source, TierKind::Hot)
                    .expect("begin");
                (set, handle, tmp)
            },
            |(mut set, handle, _tmp)| {
                let canonical = set
                    .complete_promote(black_box(handle))
                    .expect("complete");
                black_box(canonical);
            },
            criterion::BatchSize::PerIteration,
        );
    });

    // ----- end-to-end: begin + complete, 1 KiB -------------------------
    group.throughput(Throughput::Bytes(1024));
    group.bench_function("begin_complete_1kib", |b| {
        b.iter_batched(
            || {
                let tmp = tempdir().expect("tempdir");
                let mut set = two_pool_set(tmp.path(), 4, 4 * 1024);
                let source = set
                    .pool_mut(TierKind::Warm)
                    .expect("warm")
                    .alloc(vec![0x34; 1024])
                    .expect("alloc source");
                (set, source, tmp)
            },
            |(mut set, source, _tmp)| {
                let handle = set
                    .begin_promote(TierKind::Warm, black_box(source), TierKind::Hot)
                    .expect("begin");
                let canonical = set.complete_promote(handle).expect("complete");
                black_box(canonical);
            },
            criterion::BatchSize::PerIteration,
        );
    });

    group.finish();
}

// ===== bench: promote_hysteresis (M4 Plan 05) ========================

fn bench_promote_hysteresis(c: &mut Criterion) {
    let mut group = c.benchmark_group("promote_hysteresis");
    group.measurement_time(Duration::from_secs(5));

    // Bench the promote cooldown check path. Alloc a Warm chunk with
    // promote_cooldown_ns set, then begin_promote. The chunk has
    // last_promote_ns=0 so the check passes — we measure the overhead
    // of the cooldown code path itself (read + compare).
    group.bench_function("cooldown_check_1k", |b| {
        b.iter_batched(
            || {
                let tmp = tempdir().expect("tempdir");
                let hot_spec = PoolSpec {
                    tier: TierKind::Hot,
                    chunk_size: ArenaConfig::test().chunk_size,
                    num_slots: 4,
                    policy: unlimited_policy(),
                    allocator: AllocatorSelector::FixedSlot,
                };
                let warm_spec = PoolSpec {
                    tier: TierKind::Warm,
                    chunk_size: ArenaConfig::test().chunk_size,
                    num_slots: 4,
                    policy: TierPolicy {
                        max_chunks: 0,
                        eviction: EvictionKind::Lru,
                        promote_after_hits: 0,
                        demote_after_idle_ns: 0,
                        demote_cooldown_ns: 0,
                        promote_cooldown_ns: 1_000_000_000,
                    },
                    allocator: AllocatorSelector::FixedSlot,
                };
                let mut set = ArenaSet::create(
                    ArenaSetConfig::new(tmp.path())
                        .with_pool(hot_spec)
                        .with_pool(warm_spec),
                )
                .expect("create");
                let source = set
                    .pool_mut(TierKind::Warm)
                    .expect("warm")
                    .alloc(vec![0x56; 1024])
                    .expect("alloc");
                (set, source, tmp)
            },
            |(mut set, source, _tmp)| {
                let handle = set
                    .begin_promote(TierKind::Warm, black_box(source), TierKind::Hot)
                    .expect("begin");
                black_box(handle);
            },
            criterion::BatchSize::PerIteration,
        );
    });

    group.finish();
}

// ===== bench: orphan_recovery (M4 Plan 05) ===========================

fn bench_orphan_recovery(c: &mut Criterion) {
    let mut group = c.benchmark_group("orphan_recovery");
    group.measurement_time(Duration::from_secs(10));
    group.sample_size(20);

    // sweep_100_fading: open_lazy with 100 FadingOut chunks.
    group.bench_function("sweep_100_fading", |b| {
        b.iter_batched(
            || {
                let tmp = tempdir().expect("tempdir");
                {
                    let mut set = two_pool_set(tmp.path(), 200, 4 * 1024);
                    for i in 0..100u32 {
                        let source = set
                            .pool_mut(TierKind::Hot)
                            .expect("hot")
                            .alloc(vec![i as u8; 1024])
                            .expect("alloc");
                        set.begin_demote(TierKind::Hot, source, TierKind::Warm)
                            .expect("begin_demote");
                    }
                    set.flush().expect("flush");
                }
                tmp
            },
            |tmp| {
                let set = ArenaSet::open_lazy(tmp.path()).expect("open_lazy");
                black_box(set);
            },
            criterion::BatchSize::PerIteration,
        );
    });

    // sweep_100_clean: open_lazy with 100 Resident chunks (baseline).
    group.bench_function("sweep_100_clean", |b| {
        b.iter_batched(
            || {
                let tmp = tempdir().expect("tempdir");
                {
                    let mut set = two_pool_set(tmp.path(), 200, 4 * 1024);
                    for i in 0..100u32 {
                        set.pool_mut(TierKind::Hot)
                            .expect("hot")
                            .alloc(vec![i as u8; 1024])
                            .expect("alloc");
                    }
                    set.flush().expect("flush");
                }
                tmp
            },
            |tmp| {
                let set = ArenaSet::open_lazy(tmp.path()).expect("open_lazy");
                black_box(set);
            },
            criterion::BatchSize::PerIteration,
        );
    });

    group.finish();
}

// ===== bench: policy_sweep =========================================

/// Build a Hot+Warm ArenaSet with configurable policies for sweep benches.
fn sweep_set(
    root: &std::path::Path,
    num_slots: usize,
    hot_policy: TierPolicy,
    warm_policy: TierPolicy,
) -> ArenaSet {
    let slot_size = ArenaConfig::test().chunk_size;
    ArenaSet::create(
        ArenaSetConfig::new(root)
            .with_pool(PoolSpec {
                tier: TierKind::Hot,
                chunk_size: slot_size,
                num_slots,
                policy: hot_policy,
                allocator: AllocatorSelector::FixedSlot,
            })
            .with_pool(PoolSpec {
                tier: TierKind::Warm,
                chunk_size: slot_size,
                num_slots,
                policy: warm_policy,
                allocator: AllocatorSelector::FixedSlot,
            }),
    )
    .expect("sweep ArenaSet create")
}

fn bench_policy_sweep(c: &mut Criterion) {
    let mut group = c.benchmark_group("policy_sweep");
    group.measurement_time(Duration::from_secs(10));

    // ----- sweep_100_idle: 100 Hot chunks all idle → 100 demotes -----
    group.throughput(Throughput::Elements(100));
    group.bench_function("sweep_100_idle", |b| {
        b.iter_batched(
            || {
                let tmp = tempdir().expect("tempdir");
                let hot_policy = TierPolicy {
                    max_chunks: 0,
                    eviction: EvictionKind::Lru,
                    promote_after_hits: 0,
                    demote_after_idle_ns: 1,
                    demote_cooldown_ns: 0,
                    promote_cooldown_ns: 0,
                };
                let warm_policy = TierPolicy {
                    max_chunks: 0,
                    eviction: EvictionKind::Lru,
                    promote_after_hits: 0,
                    demote_after_idle_ns: 0,
                    demote_cooldown_ns: 0,
                    promote_cooldown_ns: 0,
                };
                let mut set = sweep_set(tmp.path(), 200, hot_policy, warm_policy);
                for i in 0..100u8 {
                    set.pool_mut(TierKind::Hot).unwrap().alloc(vec![i; 64]).unwrap();
                }
                fn future() -> u64 { u64::MAX / 2 }
                set.set_now_ns_for_test(future);
                (set, tmp)
            },
            |(mut set, _tmp)| {
                let report = set.run_policy_sweep();
                black_box(report);
            },
            criterion::BatchSize::PerIteration,
        );
    });

    // ----- sweep_100_hot: 100 Warm chunks all above threshold → 100 promotes
    group.throughput(Throughput::Elements(100));
    group.bench_function("sweep_100_hot", |b| {
        b.iter_batched(
            || {
                let tmp = tempdir().expect("tempdir");
                let hot_policy = TierPolicy {
                    max_chunks: 0,
                    eviction: EvictionKind::Lru,
                    promote_after_hits: 0,
                    demote_after_idle_ns: 0,
                    demote_cooldown_ns: 0,
                    promote_cooldown_ns: 0,
                };
                let warm_policy = TierPolicy {
                    max_chunks: 0,
                    eviction: EvictionKind::Lru,
                    promote_after_hits: 1,
                    demote_after_idle_ns: 0,
                    demote_cooldown_ns: 0,
                    promote_cooldown_ns: 0,
                };
                let mut set = sweep_set(tmp.path(), 200, hot_policy, warm_policy);
                for i in 0..100u8 {
                    let id = set.pool_mut(TierKind::Warm).unwrap().alloc(vec![i; 64]).unwrap();
                    set.pool_mut(TierKind::Warm).unwrap().arena_mut().touch_chunk(id).unwrap();
                }
                (set, tmp)
            },
            |(mut set, _tmp)| {
                let report = set.run_policy_sweep();
                black_box(report);
            },
            criterion::BatchSize::PerIteration,
        );
    });

    // ----- sweep_100_mixed: 50 idle Hot + 50 hot Warm ----------------
    group.throughput(Throughput::Elements(100));
    group.bench_function("sweep_100_mixed", |b| {
        b.iter_batched(
            || {
                let tmp = tempdir().expect("tempdir");
                let hot_policy = TierPolicy {
                    max_chunks: 0,
                    eviction: EvictionKind::Lru,
                    promote_after_hits: 0,
                    demote_after_idle_ns: 1,
                    demote_cooldown_ns: 0,
                    promote_cooldown_ns: 0,
                };
                let warm_policy = TierPolicy {
                    max_chunks: 0,
                    eviction: EvictionKind::Lru,
                    promote_after_hits: 1,
                    demote_after_idle_ns: 0,
                    demote_cooldown_ns: 0,
                    promote_cooldown_ns: 0,
                };
                let mut set = sweep_set(tmp.path(), 200, hot_policy, warm_policy);
                for i in 0..50u8 {
                    set.pool_mut(TierKind::Hot).unwrap().alloc(vec![i; 64]).unwrap();
                }
                for i in 0..50u8 {
                    let id = set.pool_mut(TierKind::Warm).unwrap().alloc(vec![i + 50; 64]).unwrap();
                    set.pool_mut(TierKind::Warm).unwrap().arena_mut().touch_chunk(id).unwrap();
                }
                fn future() -> u64 { u64::MAX / 2 }
                set.set_now_ns_for_test(future);
                (set, tmp)
            },
            |(mut set, _tmp)| {
                let report = set.run_policy_sweep();
                black_box(report);
            },
            criterion::BatchSize::PerIteration,
        );
    });

    // ----- sweep_100_noop: 100 chunks, none meeting thresholds -------
    group.throughput(Throughput::Elements(100));
    group.bench_function("sweep_100_noop", |b| {
        b.iter_batched(
            || {
                let tmp = tempdir().expect("tempdir");
                // High thresholds that won't be met.
                let hot_policy = TierPolicy {
                    max_chunks: 0,
                    eviction: EvictionKind::Lru,
                    promote_after_hits: 0,
                    demote_after_idle_ns: u64::MAX,
                    demote_cooldown_ns: 0,
                    promote_cooldown_ns: 0,
                };
                let warm_policy = TierPolicy {
                    max_chunks: 0,
                    eviction: EvictionKind::Lru,
                    promote_after_hits: u32::MAX,
                    demote_after_idle_ns: u64::MAX,
                    demote_cooldown_ns: 0,
                    promote_cooldown_ns: 0,
                };
                let mut set = sweep_set(tmp.path(), 200, hot_policy, warm_policy);
                for i in 0..50u8 {
                    set.pool_mut(TierKind::Hot).unwrap().alloc(vec![i; 64]).unwrap();
                }
                for i in 0..50u8 {
                    set.pool_mut(TierKind::Warm).unwrap().alloc(vec![i + 50; 64]).unwrap();
                }
                (set, tmp)
            },
            |(mut set, _tmp)| {
                let report = set.run_policy_sweep();
                black_box(report);
            },
            criterion::BatchSize::PerIteration,
        );
    });

    // ----- sweep_with_eviction: target pool full, evict + promote ----
    group.throughput(Throughput::Elements(1));
    group.bench_function("sweep_with_eviction", |b| {
        b.iter_batched(
            || {
                let tmp = tempdir().expect("tempdir");
                // Hot limited to 1 slot — forces eviction on promote.
                let hot_policy = TierPolicy {
                    max_chunks: 1,
                    eviction: EvictionKind::Lru,
                    promote_after_hits: 0,
                    demote_after_idle_ns: 0,
                    demote_cooldown_ns: 0,
                    promote_cooldown_ns: 0,
                };
                let warm_policy = TierPolicy {
                    max_chunks: 0,
                    eviction: EvictionKind::Lru,
                    promote_after_hits: 1,
                    demote_after_idle_ns: 0,
                    demote_cooldown_ns: 0,
                    promote_cooldown_ns: 0,
                };
                let mut set = sweep_set(tmp.path(), 8, hot_policy, warm_policy);
                // Fill Hot to capacity.
                set.pool_mut(TierKind::Hot).unwrap().alloc(vec![0u8; 64]).unwrap();
                // Warm chunk above promote threshold.
                let id = set.pool_mut(TierKind::Warm).unwrap().alloc(vec![1u8; 64]).unwrap();
                set.pool_mut(TierKind::Warm).unwrap().arena_mut().touch_chunk(id).unwrap();
                (set, tmp)
            },
            |(mut set, _tmp)| {
                let report = set.run_policy_sweep();
                black_box(report);
            },
            criterion::BatchSize::PerIteration,
        );
    });

    group.finish();
}

// ===== bench: vram_transfer (M6) ======================================

#[cfg(feature = "cuda")]
fn bench_vram_transfer(c: &mut Criterion) {
    use std::sync::Arc;
    use gsd_os_lib::memory_arena::vram::VramContext;

    let ctx = Arc::new(VramContext::new(0).expect("CUDA device 0"));

    let mut group = c.benchmark_group("vram_transfer");
    group.measurement_time(Duration::from_secs(5));

    // upload 1 KiB
    group.throughput(Throughput::Bytes(1024));
    group.bench_function("upload_1kib", |b| {
        let data = vec![0xABu8; 1024];
        let mut alloc = ctx.alloc(1024).expect("alloc");
        b.iter(|| {
            ctx.upload(black_box(&data), &mut alloc).expect("upload");
        });
    });

    // upload 1 MiB
    group.throughput(Throughput::Bytes(1024 * 1024));
    group.bench_function("upload_1mib", |b| {
        let data = vec![0xCDu8; 1024 * 1024];
        let mut alloc = ctx.alloc(1024 * 1024).expect("alloc");
        b.iter(|| {
            ctx.upload(black_box(&data), &mut alloc).expect("upload");
        });
    });

    // download 1 KiB
    group.throughput(Throughput::Bytes(1024));
    group.bench_function("download_1kib", |b| {
        let data = vec![0xEFu8; 1024];
        let mut alloc = ctx.alloc(1024).expect("alloc");
        ctx.upload(&data, &mut alloc).expect("upload");
        let mut buf = vec![0u8; 1024];
        b.iter(|| {
            ctx.download(&alloc, black_box(&mut buf)).expect("download");
        });
    });

    // download 1 MiB
    group.throughput(Throughput::Bytes(1024 * 1024));
    group.bench_function("download_1mib", |b| {
        let data = vec![0x42u8; 1024 * 1024];
        let mut alloc = ctx.alloc(1024 * 1024).expect("alloc");
        ctx.upload(&data, &mut alloc).expect("upload");
        let mut buf = vec![0u8; 1024 * 1024];
        b.iter(|| {
            ctx.download(&alloc, black_box(&mut buf)).expect("download");
        });
    });

    // roundtrip 1 MiB
    group.throughput(Throughput::Bytes(2 * 1024 * 1024));
    group.bench_function("roundtrip_1mib", |b| {
        let data = vec![0x77u8; 1024 * 1024];
        let mut alloc = ctx.alloc(1024 * 1024).expect("alloc");
        let mut buf = vec![0u8; 1024 * 1024];
        b.iter(|| {
            ctx.upload(black_box(&data), &mut alloc).expect("upload");
            ctx.download(&alloc, black_box(&mut buf)).expect("download");
        });
    });

    group.finish();
}

// ===== bench: vram_crossfade (M6) =====================================

#[cfg(feature = "cuda")]
fn bench_vram_crossfade(c: &mut Criterion) {
    use std::sync::Arc;
    use gsd_os_lib::memory_arena::vram::VramContext;

    let mut group = c.benchmark_group("vram_crossfade");
    group.measurement_time(Duration::from_secs(5));

    // demote Hot→Vector 1 KiB (begin + complete)
    group.throughput(Throughput::Bytes(1024));
    group.bench_function("demote_hot_to_vram_1kib", |b| {
        b.iter_batched(
            || {
                let ctx = Arc::new(VramContext::new(0).expect("cuda"));
                let tmp = tempdir().expect("tempdir");
                let config = ArenaSetConfig::new(tmp.path())
                    .with_pool(PoolSpec {
                        tier: TierKind::Hot,
                        chunk_size: 4 * 1024,
                        num_slots: 4,
                        policy: unlimited_policy(),
        allocator: AllocatorSelector::FixedSlot,
                    })
                    .with_pool(PoolSpec {
                        tier: TierKind::Vector,
                        chunk_size: 4 * 1024,
                        num_slots: 4,
                        policy: unlimited_policy(),
        allocator: AllocatorSelector::FixedSlot,
                    })
                    .with_vram_context(ctx);
                let mut set = ArenaSet::create(config).expect("create");
                let id = set
                    .pool_mut(TierKind::Hot)
                    .unwrap()
                    .alloc(vec![0xAB; 1024])
                    .expect("alloc");
                (set, id, tmp)
            },
            |(mut set, id, _tmp)| {
                let h = set
                    .begin_demote(TierKind::Hot, black_box(id), TierKind::Vector)
                    .expect("begin");
                let t = set.complete_demote(h).expect("complete");
                black_box(t);
            },
            criterion::BatchSize::PerIteration,
        );
    });

    // promote Vector→Hot 1 KiB (begin + complete)
    group.throughput(Throughput::Bytes(1024));
    group.bench_function("promote_vram_to_hot_1kib", |b| {
        b.iter_batched(
            || {
                let ctx = Arc::new(VramContext::new(0).expect("cuda"));
                let tmp = tempdir().expect("tempdir");
                let config = ArenaSetConfig::new(tmp.path())
                    .with_pool(PoolSpec {
                        tier: TierKind::Hot,
                        chunk_size: 4 * 1024,
                        num_slots: 4,
                        policy: unlimited_policy(),
        allocator: AllocatorSelector::FixedSlot,
                    })
                    .with_pool(PoolSpec {
                        tier: TierKind::Vector,
                        chunk_size: 4 * 1024,
                        num_slots: 4,
                        policy: unlimited_policy(),
        allocator: AllocatorSelector::FixedSlot,
                    })
                    .with_vram_context(ctx);
                let mut set = ArenaSet::create(config).expect("create");
                let hot_id = set
                    .pool_mut(TierKind::Hot)
                    .unwrap()
                    .alloc(vec![0xCD; 1024])
                    .expect("alloc");
                let h = set
                    .begin_demote(TierKind::Hot, hot_id, TierKind::Vector)
                    .expect("begin demote");
                let vram_id = set.complete_demote(h).expect("complete demote");
                (set, vram_id, tmp)
            },
            |(mut set, vram_id, _tmp)| {
                let h = set
                    .begin_promote(TierKind::Vector, black_box(vram_id), TierKind::Hot)
                    .expect("begin");
                let t = set.complete_promote(h).expect("complete");
                black_box(t);
            },
            criterion::BatchSize::PerIteration,
        );
    });

    // demote Hot→Vector 1 MiB (begin + complete)
    group.throughput(Throughput::Bytes(1024 * 1024));
    group.bench_function("demote_hot_to_vram_1mib", |b| {
        b.iter_batched(
            || {
                let ctx = Arc::new(VramContext::new(0).expect("cuda"));
                let tmp = tempdir().expect("tempdir");
                let config = ArenaSetConfig::new(tmp.path())
                    .with_pool(PoolSpec {
                        tier: TierKind::Hot,
                        chunk_size: 2 * 1024 * 1024,
                        num_slots: 4,
                        policy: unlimited_policy(),
        allocator: AllocatorSelector::FixedSlot,
                    })
                    .with_pool(PoolSpec {
                        tier: TierKind::Vector,
                        chunk_size: 2 * 1024 * 1024,
                        num_slots: 4,
                        policy: unlimited_policy(),
        allocator: AllocatorSelector::FixedSlot,
                    })
                    .with_vram_context(ctx);
                let mut set = ArenaSet::create(config).expect("create");
                let id = set
                    .pool_mut(TierKind::Hot)
                    .unwrap()
                    .alloc(vec![0xEF; 1024 * 1024])
                    .expect("alloc");
                (set, id, tmp)
            },
            |(mut set, id, _tmp)| {
                let h = set
                    .begin_demote(TierKind::Hot, black_box(id), TierKind::Vector)
                    .expect("begin");
                let t = set.complete_demote(h).expect("complete");
                black_box(t);
            },
            criterion::BatchSize::PerIteration,
        );
    });

    group.finish();
}

// ===== entry =======================================================

// ===== bench: allocator bake-off ======================================

/// Deterministic size sequence for the mixed workload.
fn mixed_sizes() -> Vec<usize> {
    let pattern = [64, 128, 512, 4096, 65536];
    (0..10_000).map(|i| pattern[i % pattern.len()]).collect()
}

/// Create a FixedSlotAllocator sized for the bake-off. Uses 4 KiB slots
/// with 20K capacity (enough for 10K uniform-small + headroom).
fn bakeoff_fixed() -> FixedSlotAllocator {
    FixedSlotAllocator::new(4096, 20_000)
}

/// Create a SlabAllocator for the bake-off small/churn workloads.
/// 5 classes, 10 MiB total — enough for 10K+ uniform 100B allocs.
fn bakeoff_slab() -> SlabAllocator {
    SlabAllocator::new(SlabConfig {
        classes: vec![128, 256, 1024, 4096, 65536],
        total_capacity: 10 * 1024 * 1024,
    })
}

/// Create a SlabAllocator for the bake-off mixed workload.
/// Mixed sizes: [64, 128, 512, 4096, 65536]. 10K allocs total,
/// 2K per size class → need 2K x 65536 = 128 MiB for largest class.
/// 700 MiB total / 5 classes = 140 MiB each. Plenty.
fn bakeoff_slab_mixed() -> SlabAllocator {
    SlabAllocator::new(SlabConfig {
        classes: vec![64, 128, 512, 4096, 65536],
        total_capacity: 700 * 1024 * 1024,
    })
}

/// Create a BuddyAllocator for the bake-off (256 MiB, 64B min block).
/// 256 MiB gives enough headroom for both small (10K x 100B) and large
/// (1K x 128 KiB rounded) workloads.
fn bakeoff_buddy() -> BuddyAllocator {
    BuddyAllocator::new(256 * 1024 * 1024, 64)
}

/// Create a TlsfAllocator for the bake-off (256 MiB, 64B min block).
fn bakeoff_tlsf() -> TlsfAllocator {
    TlsfAllocator::new(256 * 1024 * 1024, 64, TlsfConfig { sl_count: 4 })
}

fn bench_bakeoff_alloc_uniform_small(c: &mut Criterion) {
    let mut group = c.benchmark_group("bakeoff/alloc_uniform_small");
    group.throughput(Throughput::Elements(10_000));

    group.bench_function("fixed", |b| {
        b.iter_batched(
            bakeoff_fixed,
            |mut alloc| {
                for _ in 0..10_000 {
                    black_box(alloc.alloc(100).unwrap());
                }
            },
            criterion::BatchSize::SmallInput,
        );
    });

    group.bench_function("slab", |b| {
        b.iter_batched(
            bakeoff_slab,
            |mut alloc| {
                for _ in 0..10_000 {
                    black_box(alloc.alloc(100).unwrap());
                }
            },
            criterion::BatchSize::SmallInput,
        );
    });

    group.bench_function("buddy", |b| {
        b.iter_batched(
            bakeoff_buddy,
            |mut alloc| {
                for _ in 0..10_000 {
                    black_box(alloc.alloc(100).unwrap());
                }
            },
            criterion::BatchSize::SmallInput,
        );
    });

    group.bench_function("tlsf", |b| {
        b.iter_batched(
            bakeoff_tlsf,
            |mut alloc| {
                for _ in 0..10_000 {
                    black_box(alloc.alloc(100).unwrap());
                }
            },
            criterion::BatchSize::SmallInput,
        );
    });

    group.finish();
}

fn bench_bakeoff_alloc_uniform_large(c: &mut Criterion) {
    let mut group = c.benchmark_group("bakeoff/alloc_uniform_large");
    group.throughput(Throughput::Elements(1_000));

    group.bench_function("fixed", |b| {
        b.iter_batched(
            || FixedSlotAllocator::new(128 * 1024, 2_000),
            |mut alloc| {
                for _ in 0..1_000 {
                    black_box(alloc.alloc(100 * 1024).unwrap());
                }
            },
            criterion::BatchSize::SmallInput,
        );
    });

    group.bench_function("slab", |b| {
        b.iter_batched(
            || {
                // Large-alloc workload: 100 KiB lands in 262144 class.
                // Need 1K+ slots in that class → dedicated config.
                SlabAllocator::new(SlabConfig {
                    classes: vec![262144, 1048576],
                    total_capacity: 512 * 1024 * 1024,
                })
            },
            |mut alloc| {
                for _ in 0..1_000 {
                    black_box(alloc.alloc(100 * 1024).unwrap());
                }
            },
            criterion::BatchSize::SmallInput,
        );
    });

    group.bench_function("buddy", |b| {
        b.iter_batched(
            bakeoff_buddy,
            |mut alloc| {
                for _ in 0..1_000 {
                    black_box(alloc.alloc(100 * 1024).unwrap());
                }
            },
            criterion::BatchSize::SmallInput,
        );
    });

    group.bench_function("tlsf", |b| {
        b.iter_batched(
            bakeoff_tlsf,
            |mut alloc| {
                for _ in 0..1_000 {
                    black_box(alloc.alloc(100 * 1024).unwrap());
                }
            },
            criterion::BatchSize::SmallInput,
        );
    });

    group.finish();
}

fn bench_bakeoff_alloc_mixed(c: &mut Criterion) {
    let mut group = c.benchmark_group("bakeoff/alloc_mixed");
    let sizes = mixed_sizes();
    group.throughput(Throughput::Elements(sizes.len() as u64));

    group.bench_function("fixed", |b| {
        b.iter_batched(
            || FixedSlotAllocator::new(65536, 20_000),
            |mut alloc| {
                for &sz in &sizes {
                    black_box(alloc.alloc(sz).unwrap());
                }
            },
            criterion::BatchSize::SmallInput,
        );
    });

    group.bench_function("slab", |b| {
        b.iter_batched(
            bakeoff_slab_mixed,
            |mut alloc| {
                for &sz in &sizes {
                    black_box(alloc.alloc(sz).unwrap());
                }
            },
            criterion::BatchSize::SmallInput,
        );
    });

    group.bench_function("buddy", |b| {
        b.iter_batched(
            bakeoff_buddy,
            |mut alloc| {
                for &sz in &sizes {
                    black_box(alloc.alloc(sz).unwrap());
                }
            },
            criterion::BatchSize::SmallInput,
        );
    });

    group.bench_function("tlsf", |b| {
        b.iter_batched(
            bakeoff_tlsf,
            |mut alloc| {
                for &sz in &sizes {
                    black_box(alloc.alloc(sz).unwrap());
                }
            },
            criterion::BatchSize::SmallInput,
        );
    });

    group.finish();
}

fn bench_bakeoff_alloc_free_churn(c: &mut Criterion) {
    let mut group = c.benchmark_group("bakeoff/alloc_free_churn");
    group.throughput(Throughput::Elements(15_000)); // 10K alloc + 5K free + 5K re-alloc

    group.bench_function("fixed", |b| {
        b.iter_batched(
            bakeoff_fixed,
            |mut alloc| {
                let mut offsets = Vec::with_capacity(10_000);
                for _ in 0..10_000 {
                    let (off, _) = alloc.alloc(100).unwrap();
                    offsets.push(off);
                }
                // Free every other one
                for i in (0..offsets.len()).step_by(2) {
                    alloc.free(offsets[i]).unwrap();
                }
                // Alloc 5K more
                for _ in 0..5_000 {
                    black_box(alloc.alloc(100).unwrap());
                }
            },
            criterion::BatchSize::SmallInput,
        );
    });

    group.bench_function("slab", |b| {
        b.iter_batched(
            bakeoff_slab,
            |mut alloc| {
                let mut offsets = Vec::with_capacity(10_000);
                for _ in 0..10_000 {
                    let (off, _) = alloc.alloc(100).unwrap();
                    offsets.push(off);
                }
                for i in (0..offsets.len()).step_by(2) {
                    alloc.free(offsets[i]).unwrap();
                }
                for _ in 0..5_000 {
                    black_box(alloc.alloc(100).unwrap());
                }
            },
            criterion::BatchSize::SmallInput,
        );
    });

    group.bench_function("buddy", |b| {
        b.iter_batched(
            bakeoff_buddy,
            |mut alloc| {
                let mut offsets = Vec::with_capacity(10_000);
                for _ in 0..10_000 {
                    let (off, _) = alloc.alloc(100).unwrap();
                    offsets.push(off);
                }
                for i in (0..offsets.len()).step_by(2) {
                    alloc.free(offsets[i]).unwrap();
                }
                for _ in 0..5_000 {
                    black_box(alloc.alloc(100).unwrap());
                }
            },
            criterion::BatchSize::SmallInput,
        );
    });

    group.bench_function("tlsf", |b| {
        b.iter_batched(
            bakeoff_tlsf,
            |mut alloc| {
                let mut offsets = Vec::with_capacity(10_000);
                for _ in 0..10_000 {
                    let (off, _) = alloc.alloc(100).unwrap();
                    offsets.push(off);
                }
                for i in (0..offsets.len()).step_by(2) {
                    alloc.free(offsets[i]).unwrap();
                }
                for _ in 0..5_000 {
                    black_box(alloc.alloc(100).unwrap());
                }
            },
            criterion::BatchSize::SmallInput,
        );
    });

    group.finish();
}

fn bench_bakeoff_fragmentation(c: &mut Criterion) {
    let mut group = c.benchmark_group("bakeoff/fragmentation");
    group.throughput(Throughput::Elements(1));

    // Measure fragmentation ratio after the churn workload.
    // Uses iter_batched so the setup (alloc + free churn) is excluded
    // from timing; we're measuring only the fragmentation() call.

    group.bench_function("fixed", |b| {
        b.iter_batched(
            || {
                let mut alloc = bakeoff_fixed();
                let mut offsets = Vec::with_capacity(10_000);
                for _ in 0..10_000 {
                    let (off, _) = alloc.alloc(100).unwrap();
                    offsets.push(off);
                }
                for i in (0..offsets.len()).step_by(2) {
                    alloc.free(offsets[i]).unwrap();
                }
                for _ in 0..5_000 {
                    alloc.alloc(100).unwrap();
                }
                alloc
            },
            |alloc| {
                black_box(alloc.fragmentation());
            },
            criterion::BatchSize::SmallInput,
        );
    });

    group.bench_function("slab", |b| {
        b.iter_batched(
            || {
                let mut alloc = bakeoff_slab();
                let mut offsets = Vec::with_capacity(10_000);
                for _ in 0..10_000 {
                    let (off, _) = alloc.alloc(100).unwrap();
                    offsets.push(off);
                }
                for i in (0..offsets.len()).step_by(2) {
                    alloc.free(offsets[i]).unwrap();
                }
                for _ in 0..5_000 {
                    alloc.alloc(100).unwrap();
                }
                alloc
            },
            |alloc| {
                black_box(alloc.fragmentation());
            },
            criterion::BatchSize::SmallInput,
        );
    });

    group.bench_function("buddy", |b| {
        b.iter_batched(
            || {
                let mut alloc = bakeoff_buddy();
                let mut offsets = Vec::with_capacity(10_000);
                for _ in 0..10_000 {
                    let (off, _) = alloc.alloc(100).unwrap();
                    offsets.push(off);
                }
                for i in (0..offsets.len()).step_by(2) {
                    alloc.free(offsets[i]).unwrap();
                }
                for _ in 0..5_000 {
                    alloc.alloc(100).unwrap();
                }
                alloc
            },
            |alloc| {
                black_box(alloc.fragmentation());
            },
            criterion::BatchSize::SmallInput,
        );
    });

    group.bench_function("tlsf", |b| {
        b.iter_batched(
            || {
                let mut alloc = bakeoff_tlsf();
                let mut offsets = Vec::with_capacity(10_000);
                for _ in 0..10_000 {
                    let (off, _) = alloc.alloc(100).unwrap();
                    offsets.push(off);
                }
                for i in (0..offsets.len()).step_by(2) {
                    alloc.free(offsets[i]).unwrap();
                }
                for _ in 0..5_000 {
                    alloc.alloc(100).unwrap();
                }
                alloc
            },
            |alloc| {
                black_box(alloc.fragmentation());
            },
            criterion::BatchSize::SmallInput,
        );
    });

    group.finish();
}

// ===== bench: hugetlb =================================================

#[cfg(target_os = "linux")]
fn bench_hugetlb(c: &mut Criterion) {
    let mut group = c.benchmark_group("hugetlb");
    group.sample_size(50);

    // Alloc: hugetlb vs standard (both fall back on systems without huge pages,
    // so this measures the fallback-path baseline).
    group.bench_function("alloc_small_1kib_hugetlb", |b| {
        b.iter_batched(
            || {
                let dir = tempdir().expect("tempdir");
                let path = dir.path().join("hugetlb.arena");
                let arena = Arena::new_mmap_file_hugetlb(config_small(), 16, &path)
                    .expect("hugetlb arena");
                (arena, dir)
            },
            |(mut arena, _dir)| {
                let payload = vec![0xAA; 1024];
                let id = arena
                    .alloc_chunk(TierKind::Hot, black_box(payload))
                    .expect("alloc");
                black_box(id);
            },
            criterion::BatchSize::SmallInput,
        );
    });

    group.bench_function("alloc_small_1kib_standard", |b| {
        b.iter_batched(
            || {
                let dir = tempdir().expect("tempdir");
                let path = dir.path().join("standard.arena");
                let arena = Arena::new_mmap_file(config_small(), 16, &path)
                    .expect("standard arena");
                (arena, dir)
            },
            |(mut arena, _dir)| {
                let payload = vec![0xAA; 1024];
                let id = arena
                    .alloc_chunk(TierKind::Hot, black_box(payload))
                    .expect("alloc");
                black_box(id);
            },
            criterion::BatchSize::SmallInput,
        );
    });

    // Get: hugetlb vs standard on a prefilled mmap arena.
    group.bench_function("get_chunk_hot_hugetlb", |b| {
        let dir = tempdir().expect("tempdir");
        let path = dir.path().join("hugetlb.arena");
        let mut arena = Arena::new_mmap_file_hugetlb(config_small(), 1000, &path)
            .expect("hugetlb arena");
        for i in 0..1000 {
            arena
                .alloc_chunk(TierKind::Hot, vec![i as u8; 64])
                .expect("prefill");
        }
        let mut idx: u64 = 1;
        b.iter(|| {
            let id = ChunkId::new(idx);
            let chunk = arena.get_chunk(black_box(id)).expect("get");
            black_box(chunk);
            idx += 1;
            if idx > 1000 {
                idx = 1;
            }
        });
    });

    group.bench_function("get_chunk_hot_standard", |b| {
        let dir = tempdir().expect("tempdir");
        let path = dir.path().join("standard.arena");
        let mut arena = Arena::new_mmap_file(config_small(), 1000, &path)
            .expect("standard arena");
        for i in 0..1000 {
            arena
                .alloc_chunk(TierKind::Hot, vec![i as u8; 64])
                .expect("prefill");
        }
        let mut idx: u64 = 1;
        b.iter(|| {
            let id = ChunkId::new(idx);
            let chunk = arena.get_chunk(black_box(id)).expect("get");
            black_box(chunk);
            idx += 1;
            if idx > 1000 {
                idx = 1;
            }
        });
    });

    group.finish();
}

#[cfg(not(target_os = "linux"))]
fn bench_hugetlb(_c: &mut Criterion) {}

// ===== bench: pg_cold =================================================

#[cfg(feature = "postgres")]
fn bench_pg_cold(c: &mut Criterion) {
    use gsd_os_lib::memory_arena::pg_cold::PgColdSource;
    use gsd_os_lib::memory_arena::warm_start::ColdSource;

    let url = match std::env::var("DATABASE_URL") {
        Ok(u) => u,
        Err(_) => {
            eprintln!("DATABASE_URL not set — skipping PG benchmarks");
            return;
        }
    };

    let rt = tokio::runtime::Runtime::new().expect("tokio runtime");
    let pool = match rt.block_on(async { sqlx::PgPool::connect(&url).await }) {
        Ok(p) => p,
        Err(e) => {
            eprintln!("Cannot connect to PG: {} — skipping PG benchmarks", e);
            return;
        }
    };

    let cs = PgColdSource::new(pool, "public", "arena_cold_bench");
    cs.ensure_table().expect("ensure_table");

    let mut group = c.benchmark_group("pg_cold");
    group.sample_size(50);

    group.bench_function("store_fetch_roundtrip", |b| {
        let mut counter = 0u64;
        b.iter(|| {
            counter += 1;
            let id = ChunkId::new(counter);
            let payload = vec![0xAB; 1024];
            cs.store(TierKind::Hot, id, payload.clone()).expect("store");
            let fetched = cs.fetch(TierKind::Hot, id).expect("fetch");
            black_box(fetched);
            cs.delete(TierKind::Hot, id).expect("cleanup");
        });
    });

    group.bench_function("store_batch_100", |b| {
        let mut batch_counter = 0u64;
        b.iter(|| {
            let base = batch_counter * 100 + 100_000;
            for i in 0..100 {
                let id = ChunkId::new(base + i);
                cs.store(TierKind::Warm, id, vec![0xCD; 256]).expect("store");
            }
            // Cleanup.
            for i in 0..100 {
                cs.delete(TierKind::Warm, ChunkId::new(base + i)).expect("cleanup");
            }
            batch_counter += 1;
        });
    });

    group.bench_function("fetch_missing", |b| {
        b.iter(|| {
            let result = cs.fetch(TierKind::Blob, ChunkId::new(999_999_999)).expect("fetch");
            black_box(result);
        });
    });

    group.finish();
}

criterion_group!(
    benches,
    bench_alloc,
    bench_get,
    bench_get_zero_copy_comparison,
    bench_touch,
    bench_warm_start,
    bench_warm_start_eager,
    bench_validate_chunk,
    bench_checkpoint,
    bench_journal,
    bench_demote_crossfade,
    bench_hysteresis,
    bench_promote_crossfade,
    bench_promote_hysteresis,
    bench_orphan_recovery,
    bench_policy_sweep,
    bench_hugetlb,
);

criterion_group!(
    allocator_bakeoff,
    bench_bakeoff_alloc_uniform_small,
    bench_bakeoff_alloc_uniform_large,
    bench_bakeoff_alloc_mixed,
    bench_bakeoff_alloc_free_churn,
    bench_bakeoff_fragmentation,
);

#[cfg(feature = "cuda")]
criterion_group!(
    vram_benches,
    bench_vram_transfer,
    bench_vram_crossfade,
);

#[cfg(feature = "postgres")]
criterion_group!(
    pg_benches,
    bench_pg_cold,
);

#[cfg(all(feature = "cuda", feature = "postgres"))]
criterion_main!(benches, allocator_bakeoff, vram_benches, pg_benches);

#[cfg(all(feature = "cuda", not(feature = "postgres")))]
criterion_main!(benches, allocator_bakeoff, vram_benches);

#[cfg(all(not(feature = "cuda"), feature = "postgres"))]
criterion_main!(benches, allocator_bakeoff, pg_benches);

#[cfg(all(not(feature = "cuda"), not(feature = "postgres")))]
criterion_main!(benches, allocator_bakeoff);
