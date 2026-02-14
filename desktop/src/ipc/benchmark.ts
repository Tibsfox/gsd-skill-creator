import { invoke, Channel } from "@tauri-apps/api/core";
import type { BenchmarkResult, ChannelChunk } from "./types";

export interface BenchmarkReport {
  command_roundtrip: Record<string, number>;
  channel_throughput: Record<string, number>;
  timestamp: number;
}

const PAYLOAD_SIZES = [1024, 10240, 102400, 1048576] as const;
const CHUNK_COUNT = 10;

function sizeLabel(bytes: number): string {
  return bytes >= 1048576 ? `${bytes / 1048576}MB` : `${bytes / 1024}KB`;
}

export async function runIpcBenchmark(): Promise<BenchmarkReport> {
  const commandResults: Record<string, number> = {};
  const channelResults: Record<string, number> = {};

  // Command round-trip benchmark
  for (const size of PAYLOAD_SIZES) {
    const payload = new Array(size).fill(0xab);
    const start = performance.now();
    await invoke<BenchmarkResult>("ipc_benchmark", { payload });
    const elapsed = performance.now() - start;
    commandResults[sizeLabel(size)] = Math.round(elapsed * 100) / 100;
  }

  // Channel streaming throughput benchmark
  for (const size of PAYLOAD_SIZES) {
    let received = 0;

    const channel = new Channel<ChannelChunk>();
    const done = new Promise<void>((resolve) => {
      channel.onmessage = () => {
        received++;
        if (received >= CHUNK_COUNT) resolve();
      };
    });

    const start = performance.now();
    await invoke("ipc_benchmark_channel", {
      channel,
      payloadSize: size,
      chunkCount: CHUNK_COUNT,
    });
    await done;
    const elapsed = performance.now() - start;
    channelResults[sizeLabel(size)] = Math.round(elapsed * 100) / 100;
  }

  return {
    command_roundtrip: commandResults,
    channel_throughput: channelResults,
    timestamp: Date.now(),
  };
}
