import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { randomFillSync } from "node:crypto";
import { mockIPC, clearMocks } from "@tauri-apps/api/mocks";
import { streamEchoData } from "./channels";

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

describe("streamEchoData", () => {
  it("receives ordered chunks via channel", async () => {
    const receivedChunks: Array<{ index: number; data: number[]; size: number }> = [];

    mockIPC((cmd, payload) => {
      if (cmd === "echo_channel") {
        // In the mock environment, the Channel object is passed directly
        // (not serialized). Its .id property is the callback identifier
        // registered via transformCallback, so we use runCallback(id, ...)
        // to simulate the Rust backend sending data through the channel.
        const args = payload as Record<string, unknown>;
        const channelObj = args.channel as { id: number };
        const channelId = channelObj.id;
        const chunkCount = args.chunkCount as number;
        const payloadSize = args.payloadSize as number;

        // Simulate sending chunks through the channel
        for (let i = 0; i < chunkCount; i++) {
          const chunk = {
            index: i,
            data: Array(payloadSize).fill(0xab),
            size: payloadSize,
          };
          window.__TAURI_INTERNALS__.runCallback(channelId, {
            index: i,
            message: chunk,
          });
        }
        // Signal end of channel
        window.__TAURI_INTERNALS__.runCallback(channelId, {
          index: chunkCount,
          end: true,
        });
      }
    });

    await streamEchoData(4, 3, (chunk) => {
      receivedChunks.push(chunk);
    });

    expect(receivedChunks).toHaveLength(3);
    expect(receivedChunks[0]).toEqual({
      index: 0,
      data: [0xab, 0xab, 0xab, 0xab],
      size: 4,
    });
    expect(receivedChunks[1].index).toBe(1);
    expect(receivedChunks[2].index).toBe(2);
  });

  it("passes correct payload size and chunk count to invoke", async () => {
    const invokedArgs: Record<string, unknown>[] = [];

    mockIPC((cmd, payload) => {
      if (cmd === "echo_channel") {
        const args = payload as Record<string, unknown>;
        invokedArgs.push(args);

        // Send minimal data to satisfy the channel
        const channelObj = args.channel as { id: number };
        const channelId = channelObj.id;
        window.__TAURI_INTERNALS__.runCallback(channelId, {
          index: 0,
          message: { index: 0, data: [0xab], size: 1 },
        });
        window.__TAURI_INTERNALS__.runCallback(channelId, {
          index: 1,
          end: true,
        });
      }
    });

    await streamEchoData(1024, 1, () => {});

    expect(invokedArgs).toHaveLength(1);
    expect(invokedArgs[0].payloadSize).toBe(1024);
    expect(invokedArgs[0].chunkCount).toBe(1);
  });
});
