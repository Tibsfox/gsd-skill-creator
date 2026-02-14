import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { randomFillSync } from "node:crypto";
import { mockIPC, clearMocks } from "@tauri-apps/api/mocks";
import { emit } from "@tauri-apps/api/event";
import {
  startWatcher,
  stopWatcher,
  watcherStatus,
  onFileChanged,
  onWatcherError,
} from "./watcher";
import type { WatcherEventBatch } from "./watcher";

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

describe("startWatcher", () => {
  it("invokes start_watcher with path and projectRoot", async () => {
    const handler = vi.fn();
    mockIPC((cmd, args) => {
      if (cmd === "start_watcher") {
        handler(args);
        return undefined;
      }
    });

    await startWatcher(".planning/", "/project");

    expect(handler).toHaveBeenCalledWith({
      path: ".planning/",
      projectRoot: "/project",
    });
  });
});

describe("stopWatcher", () => {
  it("invokes stop_watcher", async () => {
    const handler = vi.fn();
    mockIPC((cmd) => {
      if (cmd === "stop_watcher") {
        handler();
        return undefined;
      }
    });

    await stopWatcher();

    expect(handler).toHaveBeenCalled();
  });
});

describe("watcherStatus", () => {
  it("returns boolean", async () => {
    mockIPC((cmd) => {
      if (cmd === "watcher_status") {
        return true;
      }
    });

    const result = await watcherStatus();

    expect(result).toBe(true);
  });
});

describe("onFileChanged", () => {
  it("receives batched events", async () => {
    mockIPC(() => {}, { shouldMockEvents: true });

    const callback = vi.fn();
    const unlisten = await onFileChanged(callback);

    const batch: WatcherEventBatch = {
      events: [{ path: ".planning/STATE.md", kind: "modify" }],
      count: 1,
    };
    await emit("fs:changed", batch);

    expect(callback).toHaveBeenCalledWith(batch);
    expect(typeof unlisten).toBe("function");
  });

  it("unlisten stops events", async () => {
    mockIPC(() => {}, { shouldMockEvents: true });

    const callback = vi.fn();
    const unlisten = await onFileChanged(callback);

    unlisten();

    const batch: WatcherEventBatch = {
      events: [{ path: ".planning/STATE.md", kind: "modify" }],
      count: 1,
    };
    await emit("fs:changed", batch);

    expect(callback).not.toHaveBeenCalled();
  });
});

describe("onWatcherError", () => {
  it("receives error strings", async () => {
    mockIPC(() => {}, { shouldMockEvents: true });

    const callback = vi.fn();
    const unlisten = await onWatcherError(callback);

    await emit("fs:watcher-error", "Watcher disconnected");

    expect(callback).toHaveBeenCalledWith("Watcher disconnected");
    expect(typeof unlisten).toBe("function");
  });
});
