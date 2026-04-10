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
    persistence::{replay_into, write_checkpoint, JournalReader, JournalWriter},
    pool::{ArenaSet, ArenaSetConfig, EvictionKind, PoolSpec, TierPolicy},
    types::{ArenaConfig, ChunkId, TierKind},
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
    }
}

/// PoolSpec for a Hot tier with N slots, using ArenaConfig::test() sizing.
fn hot_spec(num_slots: usize) -> PoolSpec {
    PoolSpec {
        tier: TierKind::Hot,
        chunk_size: ArenaConfig::test().chunk_size,
        num_slots,
        policy: unlimited_policy(),
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

// ===== entry =======================================================

criterion_group!(
    benches,
    bench_alloc,
    bench_get,
    bench_touch,
    bench_warm_start,
    bench_warm_start_eager,
    bench_validate_chunk,
    bench_checkpoint,
    bench_journal,
);
criterion_main!(benches);
