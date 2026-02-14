use serde::Serialize;
use tauri::ipc::Channel;

#[derive(Debug, Clone, Serialize)]
pub struct BenchmarkResult {
    pub payload_size: usize,
    pub round_trip_ms: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct ChannelBenchmarkChunk {
    pub index: u32,
    pub data: Vec<u8>,
}

/// Returns the payload size for round-trip timing measurement.
/// The frontend measures actual round-trip time; Rust just echoes metadata.
#[tauri::command]
pub fn ipc_benchmark(payload: Vec<u8>) -> Result<BenchmarkResult, String> {
    Ok(BenchmarkResult {
        payload_size: payload.len(),
        round_trip_ms: 0.0,
    })
}

/// Sends N chunks via channel for throughput measurement.
#[tauri::command]
pub fn ipc_benchmark_channel(
    channel: Channel<ChannelBenchmarkChunk>,
    payload_size: usize,
    chunk_count: u32,
) -> Result<(), String> {
    let data = vec![0xABu8; payload_size];

    for i in 0..chunk_count {
        let chunk = ChannelBenchmarkChunk {
            index: i,
            data: data.clone(),
        };
        channel.send(chunk).map_err(|e| e.to_string())?;
    }

    Ok(())
}
