import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { randomFillSync } from "node:crypto";
import { mockIPC, clearMocks } from "@tauri-apps/api/mocks";
import { runIpcBenchmark } from "./benchmark";

// jsdom does not provide crypto.getRandomValues; mockIPC needs it
// to generate callback identifiers via window.crypto.getRandomValues.
beforeEach(() => {
  if (!globalThis.crypto?.getRandomValues) {
    Object.defineProperty(globalThis, "crypto", {
      configurable: true,
      value: {
        getRandomValues: (arr: Uint32Array) => randomFillSync(arr),
      },
    });
  }
});

afterEach(() => {
  clearMocks();
});

describe("runIpcBenchmark", () => {
  it("returns report with all four payload sizes", async () => {
    mockIPC((cmd, payload) => {
      if (cmd === "ipc_benchmark") {
        const args = payload as Record<string, unknown>;
        const p = args.payload as number[];
        return { payload_size: p.length, round_trip_ms: 0.0 };
      }
      if (cmd === "ipc_benchmark_channel") {
        // For channel calls, simulate immediate resolution by
        // invoking channel callbacks via __TAURI_INTERNALS__
        const args = payload as Record<string, unknown>;
        const channelObj = args.channel as { id: number };
        const channelId = channelObj.id;
        const chunkCount = args.chunkCount as number;

        for (let i = 0; i < chunkCount; i++) {
          window.__TAURI_INTERNALS__.runCallback(channelId, {
            index: i,
            message: { index: i, data: [0xab], size: 1 },
          });
        }
        window.__TAURI_INTERNALS__.runCallback(channelId, {
          index: chunkCount,
          end: true,
        });
      }
    });

    const report = await runIpcBenchmark();

    // All four size labels must be present
    for (const label of ["1KB", "10KB", "100KB", "1MB"]) {
      expect(report.command_roundtrip).toHaveProperty(label);
      expect(typeof report.command_roundtrip[label]).toBe("number");
      expect(report.command_roundtrip[label]).toBeGreaterThanOrEqual(0);

      expect(report.channel_throughput).toHaveProperty(label);
      expect(typeof report.channel_throughput[label]).toBe("number");
      expect(report.channel_throughput[label]).toBeGreaterThanOrEqual(0);
    }
  });

  it("includes timestamp close to Date.now()", async () => {
    mockIPC((cmd, payload) => {
      if (cmd === "ipc_benchmark") {
        const args = payload as Record<string, unknown>;
        const p = args.payload as number[];
        return { payload_size: p.length, round_trip_ms: 0.0 };
      }
      if (cmd === "ipc_benchmark_channel") {
        const args = payload as Record<string, unknown>;
        const channelObj = args.channel as { id: number };
        const channelId = channelObj.id;
        const chunkCount = args.chunkCount as number;

        for (let i = 0; i < chunkCount; i++) {
          window.__TAURI_INTERNALS__.runCallback(channelId, {
            index: i,
            message: { index: i, data: [0xab], size: 1 },
          });
        }
        window.__TAURI_INTERNALS__.runCallback(channelId, {
          index: chunkCount,
          end: true,
        });
      }
    });

    const before = Date.now();
    const report = await runIpcBenchmark();
    const after = Date.now();

    expect(typeof report.timestamp).toBe("number");
    expect(report.timestamp).toBeGreaterThanOrEqual(before - 5000);
    expect(report.timestamp).toBeLessThanOrEqual(after + 5000);
  });

  it("measures round-trip for each payload size", async () => {
    const invokedSizes: number[] = [];

    mockIPC((cmd, payload) => {
      if (cmd === "ipc_benchmark") {
        const args = payload as Record<string, unknown>;
        const p = args.payload as number[];
        invokedSizes.push(p.length);
        return { payload_size: p.length, round_trip_ms: 0.0 };
      }
      if (cmd === "ipc_benchmark_channel") {
        const args = payload as Record<string, unknown>;
        const channelObj = args.channel as { id: number };
        const channelId = channelObj.id;
        const chunkCount = args.chunkCount as number;

        for (let i = 0; i < chunkCount; i++) {
          window.__TAURI_INTERNALS__.runCallback(channelId, {
            index: i,
            message: { index: i, data: [0xab], size: 1 },
          });
        }
        window.__TAURI_INTERNALS__.runCallback(channelId, {
          index: chunkCount,
          end: true,
        });
      }
    });

    await runIpcBenchmark();

    expect(invokedSizes).toEqual([1024, 10240, 102400, 1048576]);
  });

  it("handles channel streaming for throughput", async () => {
    const channelInvocations: Array<{ payloadSize: number; chunkCount: number }> = [];

    mockIPC((cmd, payload) => {
      if (cmd === "ipc_benchmark") {
        const args = payload as Record<string, unknown>;
        const p = args.payload as number[];
        return { payload_size: p.length, round_trip_ms: 0.0 };
      }
      if (cmd === "ipc_benchmark_channel") {
        const args = payload as Record<string, unknown>;
        channelInvocations.push({
          payloadSize: args.payloadSize as number,
          chunkCount: args.chunkCount as number,
        });

        const channelObj = args.channel as { id: number };
        const channelId = channelObj.id;
        const chunkCount = args.chunkCount as number;

        for (let i = 0; i < chunkCount; i++) {
          window.__TAURI_INTERNALS__.runCallback(channelId, {
            index: i,
            message: { index: i, data: [0xab], size: 1 },
          });
        }
        window.__TAURI_INTERNALS__.runCallback(channelId, {
          index: chunkCount,
          end: true,
        });
      }
    });

    await runIpcBenchmark();

    // Should be called 4 times, once per payload size
    expect(channelInvocations).toHaveLength(4);

    // Each invocation should use chunkCount of 10
    const expectedSizes = [1024, 10240, 102400, 1048576];
    for (let i = 0; i < 4; i++) {
      expect(channelInvocations[i].payloadSize).toBe(expectedSizes[i]);
      expect(channelInvocations[i].chunkCount).toBe(10);
    }
  });
});
