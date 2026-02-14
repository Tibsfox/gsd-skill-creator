import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { randomFillSync } from "node:crypto";
import { mockIPC, clearMocks } from "@tauri-apps/api/mocks";
import { emit } from "@tauri-apps/api/event";
import { SessionMonitor } from "./session-monitor";
import type { ClaudeStatusEvent } from "./types";

beforeEach(() => {
  if (!globalThis.crypto?.getRandomValues) {
    Object.defineProperty(globalThis, "crypto", {
      configurable: true,
      value: { getRandomValues: (arr: Uint32Array) => randomFillSync(arr) },
    });
  }
});

afterEach(() => {
  clearMocks();
});

const makeEvent = (overrides: Partial<ClaudeStatusEvent> = {}): ClaudeStatusEvent => ({
  id: "sess-001",
  status: "active",
  timestamp: 1707900000,
  ...overrides,
});

describe("SessionMonitor", () => {
  it("start() begins listening for claude:status events", async () => {
    mockIPC(() => {}, { shouldMockEvents: true });

    const monitor = new SessionMonitor();
    await monitor.start();

    expect(monitor.isActive()).toBe(true);
  });

  it("stop() calls unlisten and sets started to false", async () => {
    mockIPC(() => {}, { shouldMockEvents: true });

    const monitor = new SessionMonitor();
    await monitor.start();
    expect(monitor.isActive()).toBe(true);

    await monitor.stop();
    expect(monitor.isActive()).toBe(false);
  });

  it("subscribe returns unsubscribe function", async () => {
    mockIPC(() => {}, { shouldMockEvents: true });

    const monitor = new SessionMonitor();
    const callback = vi.fn();
    const unsub = monitor.subscribe(callback);

    expect(monitor.listenerCount()).toBe(1);
    expect(typeof unsub).toBe("function");

    unsub();
    expect(monitor.listenerCount()).toBe(0);
  });

  it("status events are forwarded to all subscribers", async () => {
    mockIPC(() => {}, { shouldMockEvents: true });

    const monitor = new SessionMonitor();
    await monitor.start();

    const cb1 = vi.fn();
    const cb2 = vi.fn();
    monitor.subscribe(cb1);
    monitor.subscribe(cb2);

    const event = makeEvent({ status: "paused" });
    await emit("claude:status", event);

    expect(cb1).toHaveBeenCalledWith(event);
    expect(cb2).toHaveBeenCalledWith(event);
  });

  it("unsubscribed callbacks do not receive events", async () => {
    mockIPC(() => {}, { shouldMockEvents: true });

    const monitor = new SessionMonitor();
    await monitor.start();

    const callback = vi.fn();
    const unsub = monitor.subscribe(callback);
    unsub();

    const event = makeEvent();
    await emit("claude:status", event);

    expect(callback).not.toHaveBeenCalled();
  });

  it("isActive returns false before start", () => {
    const monitor = new SessionMonitor();
    expect(monitor.isActive()).toBe(false);
  });

  it("listenerCount returns correct count", () => {
    const monitor = new SessionMonitor();
    const unsub1 = monitor.subscribe(vi.fn());
    monitor.subscribe(vi.fn());

    expect(monitor.listenerCount()).toBe(2);

    unsub1();
    expect(monitor.listenerCount()).toBe(1);
  });
});
