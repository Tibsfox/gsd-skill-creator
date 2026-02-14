import { invoke, Channel } from "@tauri-apps/api/core";
import type { BenchmarkResult, ChannelChunk } from "./types";

export interface BenchmarkReport {
  command_roundtrip: Record<string, number>;
  channel_throughput: Record<string, number>;
  timestamp: number;
}

export async function runIpcBenchmark(): Promise<BenchmarkReport> {
  throw new Error("not implemented");
}
