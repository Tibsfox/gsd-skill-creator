//! Memory arena microbenchmark.
//!
//! Measures latency for the core arena operations under both heap and
//! file-backed mmap storage. No external bench crate dependency — uses
//! `std::time::Instant` with warmup + fixed iteration counts. This gives
//! us the M1 baseline numbers for Session 008.
//!
//! Run with:
//! ```
//! cargo run --example arena_bench --release
//! ```
//!
//! Output: latency in microseconds for each op, per backing mode.

use std::time::Instant;

use gsd_os_lib::memory_arena::{
    persistence::{write_checkpoint, JournalReader, JournalWriter},
    Arena, ArenaConfig, TierKind,
};

const WARMUP_ITERS: usize = 100;
const MEASURE_ITERS: usize = 1_000;
const PAYLOAD_SIZES: &[usize] = &[64, 1_024, 16_384, 256_000];

fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("╔════════════════════════════════════════════════════════════════╗");
    println!("║             Memory Arena Microbenchmark (M5)                   ║");
    println!("║                                                                ║");
    println!("║  Warmup: {} iters   Measure: {} iters                   ║", WARMUP_ITERS, MEASURE_ITERS);
    println!("╚════════════════════════════════════════════════════════════════╝");
    println!();

    // Bench config: 1 MiB slots, enough for our largest test payload.
    let mut config = ArenaConfig::default();
    config.chunk_size = 1024 * 1024;
    config.min_chunk_size = 64 * 1024;
    config.max_chunk_size = 4 * 1024 * 1024;

    // 2048 slots × 1 MiB = 2 GiB total per arena. Room for MEASURE_ITERS
    // allocations plus a safety margin.
    let num_slots = 2048;

    bench_mode("heap-backed", &|| {
        Ok(Arena::new(config.clone(), num_slots)?)
    })?;

    // mmap mode uses a tempfile that lives for the duration of the bench.
    let tmp = tempfile::tempdir()?;
    let mmap_path = tmp.path().join("bench-arena.bin");
    bench_mode("mmap-backed", &|| {
        // Each iteration inside bench_mode reuses the same file; that's
        // fine for benching alloc/get/free in-place.
        Ok(Arena::new_mmap_file(config.clone(), num_slots, &mmap_path)?)
    })?;

    // Checkpoint + journal benches (heap only — mmap doesn't change the
    // write-side behavior for these ops).
    bench_checkpoint_and_journal(&config, num_slots)?;

    println!();
    println!("Done. All numbers are per-operation latency in microseconds.");
    Ok(())
}

// ─── Operation benches ──────────────────────────────────────────────────────

fn bench_mode(
    label: &str,
    make_arena: &dyn Fn() -> Result<Arena, Box<dyn std::error::Error>>,
) -> Result<(), Box<dyn std::error::Error>> {
    println!("─── {} ───", label);
    println!(
        "{:>12} {:>12} {:>12} {:>12} {:>12}",
        "payload", "alloc p50", "alloc p99", "get p50", "free p50"
    );

    for &size in PAYLOAD_SIZES {
        let mut arena = make_arena()?;
        let payload = vec![0x42u8; size];

        // Allocation benchmark: alloc, free, repeat (keeps slot count steady).
        // Warmup
        for _ in 0..WARMUP_ITERS {
            let id = arena.alloc_chunk(TierKind::Warm, payload.clone())?;
            arena.free_chunk(id)?;
        }

        // Measure alloc
        let mut alloc_samples_ns = Vec::with_capacity(MEASURE_ITERS);
        let mut ids = Vec::with_capacity(MEASURE_ITERS);
        // Alloc batch: measure each alloc in isolation.
        for _ in 0..MEASURE_ITERS {
            let start = Instant::now();
            let id = arena.alloc_chunk(TierKind::Warm, payload.clone())?;
            alloc_samples_ns.push(start.elapsed().as_nanos() as u64);
            ids.push(id);
        }

        // Measure get on the allocated ids (all in arena).
        let mut get_samples_ns = Vec::with_capacity(MEASURE_ITERS);
        for &id in &ids {
            let start = Instant::now();
            let _chunk = arena.get_chunk(id)?;
            get_samples_ns.push(start.elapsed().as_nanos() as u64);
        }

        // Measure free.
        let mut free_samples_ns = Vec::with_capacity(MEASURE_ITERS);
        for &id in &ids {
            let start = Instant::now();
            arena.free_chunk(id)?;
            free_samples_ns.push(start.elapsed().as_nanos() as u64);
        }

        let alloc_p50 = percentile(&mut alloc_samples_ns, 50);
        let alloc_p99 = percentile(&mut alloc_samples_ns, 99);
        let get_p50 = percentile(&mut get_samples_ns, 50);
        let free_p50 = percentile(&mut free_samples_ns, 50);

        println!(
            "{:>12} {:>10}µs {:>10}µs {:>10}µs {:>10}µs",
            format_bytes(size),
            ns_to_us(alloc_p50),
            ns_to_us(alloc_p99),
            ns_to_us(get_p50),
            ns_to_us(free_p50),
        );
    }
    println!();
    Ok(())
}

fn bench_checkpoint_and_journal(
    config: &ArenaConfig,
    num_slots: usize,
) -> Result<(), Box<dyn std::error::Error>> {
    println!("─── checkpoint + journal (heap-backed, 1 MiB slots) ───");
    println!(
        "{:>16} {:>14} {:>14} {:>14}",
        "arena-fill", "checkpoint", "jrnl-append", "jrnl-replay"
    );

    let tmp = tempfile::tempdir()?;
    let jrnl_path = tmp.path().join("bench.journal");
    let ckpt_path = tmp.path().join("bench.ckpt");

    for &fill in &[10usize, 50, 100, 200] {
        let mut arena = Arena::new(config.clone(), num_slots)?;
        let payload = vec![0xA5u8; 1024];
        let mut ids = Vec::with_capacity(fill);
        for _ in 0..fill {
            ids.push(arena.alloc_chunk(TierKind::Warm, payload.clone())?);
        }

        // Checkpoint latency (median of N runs)
        let mut ckpt_samples = Vec::new();
        for _ in 0..20 {
            let start = Instant::now();
            write_checkpoint(&arena, &ckpt_path)?;
            ckpt_samples.push(start.elapsed().as_nanos() as u64);
        }

        // Journal append latency (median of N appends, flushed after each)
        let _ = std::fs::remove_file(&jrnl_path);
        let mut writer = JournalWriter::open(&jrnl_path)?;
        let mut append_samples = Vec::with_capacity(fill);
        for &id in &ids {
            let chunk_bytes = arena.get_chunk(id)?.serialize();
            let start = Instant::now();
            writer.append_alloc(id, &chunk_bytes)?;
            writer.flush()?;
            append_samples.push(start.elapsed().as_nanos() as u64);
        }

        // Journal replay latency (load a fresh arena, replay the journal)
        let mut empty_arena = Arena::new(config.clone(), num_slots)?;
        let reader = JournalReader::open(&jrnl_path)?;
        let start = Instant::now();
        gsd_os_lib::memory_arena::persistence::replay_into(&mut empty_arena, reader)?;
        let replay_total_ns = start.elapsed().as_nanos() as u64;

        let ckpt_p50 = percentile(&mut ckpt_samples, 50);
        let append_p50 = percentile(&mut append_samples, 50);

        println!(
            "{:>14} ops {:>12}µs {:>12}µs {:>12}µs",
            fill,
            ns_to_us(ckpt_p50),
            ns_to_us(append_p50),
            ns_to_us(replay_total_ns),
        );
    }
    println!();
    Ok(())
}

// ─── Helpers ────────────────────────────────────────────────────────────────

fn percentile(samples: &mut [u64], p: usize) -> u64 {
    samples.sort_unstable();
    let idx = (samples.len() * p / 100).min(samples.len() - 1);
    samples[idx]
}

fn ns_to_us(ns: u64) -> String {
    let us = ns as f64 / 1_000.0;
    if us >= 100.0 {
        format!("{:.0}", us)
    } else if us >= 10.0 {
        format!("{:.1}", us)
    } else {
        format!("{:.2}", us)
    }
}

fn format_bytes(bytes: usize) -> String {
    if bytes >= 1024 * 1024 {
        format!("{} MiB", bytes / (1024 * 1024))
    } else if bytes >= 1024 {
        format!("{} KiB", bytes / 1024)
    } else {
        format!("{} B", bytes)
    }
}
