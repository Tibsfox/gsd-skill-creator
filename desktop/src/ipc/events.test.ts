import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { randomFillSync } from "node:crypto";
import { mockIPC, clearMocks } from "@tauri-apps/api/mocks";
import { emit } from "@tauri-apps/api/event";
import { onEchoResponse } from "./events";

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

describe("onEchoResponse", () => {
  it("registers listener and receives events", async () => {
    // Enable event mocking so listen/emit work in test environment
    mockIPC(() => {}, { shouldMockEvents: true });

    const callback = vi.fn();
    const unlisten = await onEchoResponse(callback);

    // Emit the event that Rust backend would emit
    await emit("echo-response", { status: "ok", detail: "test-msg" });

    expect(callback).toHaveBeenCalledWith({
      status: "ok",
      detail: "test-msg",
    });
    expect(typeof unlisten).toBe("function");
  });

  it("returns an unlisten function that stops events", async () => {
    mockIPC(() => {}, { shouldMockEvents: true });

    const callback = vi.fn();
    const unlisten = await onEchoResponse(callback);

    // unlisten should be callable
    expect(typeof unlisten).toBe("function");
    unlisten();

    // After unlistening, new events should not reach callback
    await emit("echo-response", { status: "ok", detail: "after-unlisten" });

    // Should only have been called 0 times (or at most 0 since we
    // unlistened before emitting)
    expect(callback).not.toHaveBeenCalled();
  });
});
