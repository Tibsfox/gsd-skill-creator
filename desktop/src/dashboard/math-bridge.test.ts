import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { MathBridge } from "./math-bridge";
import { MathPanel } from "./math-panel";
import type { MathPanelData, OperationRecord } from "./math-panel";

// Mock @tauri-apps/api/core
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

// Mock @tauri-apps/api/event
const mockListenCallbacks = new Map<string, (event: { payload: unknown }) => void>();
const mockUnlisten = vi.fn();
vi.mock("@tauri-apps/api/event", () => ({
  listen: vi.fn((eventName: string, callback: (event: { payload: unknown }) => void) => {
    mockListenCallbacks.set(eventName, callback);
    return Promise.resolve(mockUnlisten);
  }),
}));

import { invoke } from "@tauri-apps/api/core";

const mockInvoke = vi.mocked(invoke);

function makeCapabilitiesResponse() {
  return {
    success: true,
    result: {
      chips: {
        algebrus: {
          chip: "ALGEBRUS",
          operations: ["gemm", "solve", "svd"],
          gpu_accelerated: ["gemm"],
          cpu_fallback: ["solve", "svd"],
          enabled: true,
        },
        fourier: {
          chip: "FOURIER",
          operations: ["fft", "ifft"],
          gpu_accelerated: [],
          cpu_fallback: ["fft", "ifft"],
          enabled: true,
        },
        symbex: {
          chip: "SYMBEX",
          operations: ["eval", "verify"],
          gpu_accelerated: ["eval", "verify"],
          cpu_fallback: [],
          enabled: true,
          jit_available: true,
        },
      },
      gpu: { available: true, name: "RTX 4060 Ti", free_memory_mb: 6144 },
      vram: {
        budget_mb: 750,
        allocated_mb: 128,
        utilization_pct: 17.1,
        gpu_name: "RTX 4060 Ti",
        gpu_free_mb: 6144,
      },
      streams: {
        dedicated_stream: true,
        stream_priority: 1,
        active_ops: 0,
        max_concurrent_ops: 4,
      },
    },
  };
}

function makeContainer(): HTMLElement {
  const el = document.createElement("div");
  document.body.appendChild(el);
  return el;
}

describe("MathBridge", () => {
  let panel: MathPanel;
  let bridge: MathBridge;
  let container: HTMLElement;

  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = "";
    mockListenCallbacks.clear();
    mockUnlisten.mockClear();
    mockInvoke.mockReset();

    container = makeContainer();
    panel = new MathPanel(container);
  });

  afterEach(() => {
    bridge?.destroy();
    panel.destroy();
    vi.useRealTimers();
  });

  describe("constructor", () => {
    it("creates bridge with default poll interval", () => {
      bridge = new MathBridge({ panel });
      expect(bridge).toBeDefined();
    });

    it("accepts custom poll interval", () => {
      bridge = new MathBridge({ panel, pollIntervalMs: 10000 });
      expect(bridge).toBeDefined();
    });
  });

  describe("start()", () => {
    it("fetches capabilities on start", async () => {
      mockInvoke.mockResolvedValue(makeCapabilitiesResponse());
      bridge = new MathBridge({ panel });
      await bridge.start();

      expect(mockInvoke).toHaveBeenCalledWith("mcp_call_tool", {
        toolName: "math.capabilities",
        params: {},
      });
    });

    it("updates panel with transformed data", async () => {
      mockInvoke.mockResolvedValue(makeCapabilitiesResponse());
      const updateSpy = vi.spyOn(panel, "update");

      bridge = new MathBridge({ panel });
      await bridge.start();

      expect(updateSpy).toHaveBeenCalledOnce();
      const data: MathPanelData = updateSpy.mock.calls[0][0];

      // Check chips
      expect(data.chips).toHaveLength(3);
      expect(data.chips[0].name).toBe("ALGEBRUS");
      expect(data.chips[0].backend).toBe("gpu");

      // Check VRAM
      expect(data.vram.budgetMb).toBe(750);
      expect(data.vram.gpuName).toBe("RTX 4060 Ti");

      // Check streams
      expect(data.streams.dedicatedStream).toBe(true);
    });

    it("registers trace event listener", async () => {
      mockInvoke.mockResolvedValue(makeCapabilitiesResponse());
      bridge = new MathBridge({ panel });
      await bridge.start();

      expect(mockListenCallbacks.has("mcp-trace")).toBe(true);
    });

    it("handles server unavailable gracefully", async () => {
      mockInvoke.mockRejectedValue(new Error("Server not connected"));
      bridge = new MathBridge({ panel });

      // Should not throw
      await bridge.start();
    });
  });

  describe("polling", () => {
    it("polls at configured interval", async () => {
      mockInvoke.mockResolvedValue(makeCapabilitiesResponse());
      bridge = new MathBridge({ panel, pollIntervalMs: 1000 });
      await bridge.start();

      const initialCalls = mockInvoke.mock.calls.length;

      // Advance timer past one interval
      vi.advanceTimersByTime(1000);
      // Allow the promise to resolve
      await vi.runOnlyPendingTimersAsync();

      // Should have at least one more call from the poll tick
      expect(mockInvoke.mock.calls.length).toBeGreaterThan(initialCalls);
    });
  });

  describe("trace event handling", () => {
    it("captures math operations from trace events", async () => {
      mockInvoke.mockResolvedValue(makeCapabilitiesResponse());
      const addOpSpy = vi.spyOn(panel, "addOperation");

      bridge = new MathBridge({ panel });
      await bridge.start();

      // Simulate a trace event
      const traceCallback = mockListenCallbacks.get("mcp-trace");
      expect(traceCallback).toBeDefined();

      traceCallback!({
        payload: {
          server_id: "gsd-math-coprocessor",
          method: "tools/call:algebrus.gemm",
          timestamp_ms: Date.now(),
          result: {
            backend: "gpu",
            computation_time_ms: 1.234,
            precision: "fp64",
          },
        },
      });

      expect(addOpSpy).toHaveBeenCalledOnce();
      const op: OperationRecord = addOpSpy.mock.calls[0][0];
      expect(op.name).toBe("algebrus.gemm");
      expect(op.backend).toBe("gpu");
      expect(op.timeMs).toBe(1.234);
    });

    it("ignores non-math server trace events", async () => {
      mockInvoke.mockResolvedValue(makeCapabilitiesResponse());
      const addOpSpy = vi.spyOn(panel, "addOperation");

      bridge = new MathBridge({ panel });
      await bridge.start();

      const traceCallback = mockListenCallbacks.get("mcp-trace");
      traceCallback!({
        payload: {
          server_id: "some-other-server",
          method: "tools/call:some_tool",
          timestamp_ms: Date.now(),
        },
      });

      expect(addOpSpy).not.toHaveBeenCalled();
    });

    it("ignores meta tools (math.*)", async () => {
      mockInvoke.mockResolvedValue(makeCapabilitiesResponse());
      const addOpSpy = vi.spyOn(panel, "addOperation");

      bridge = new MathBridge({ panel });
      await bridge.start();

      const traceCallback = mockListenCallbacks.get("mcp-trace");
      traceCallback!({
        payload: {
          server_id: "gsd-math-coprocessor",
          method: "tools/call:math.capabilities",
          timestamp_ms: Date.now(),
        },
      });

      expect(addOpSpy).not.toHaveBeenCalled();
    });

    it("tracks per-chip operation counts", async () => {
      mockInvoke.mockResolvedValue(makeCapabilitiesResponse());
      const updateSpy = vi.spyOn(panel, "update");

      bridge = new MathBridge({ panel });
      await bridge.start();

      // Fire a trace event
      const traceCallback = mockListenCallbacks.get("mcp-trace");
      traceCallback!({
        payload: {
          server_id: "gsd-math-coprocessor",
          method: "tools/call:algebrus.gemm",
          timestamp_ms: Date.now(),
          result: { backend: "gpu", computation_time_ms: 0.5, precision: "fp64" },
        },
      });
      traceCallback!({
        payload: {
          server_id: "gsd-math-coprocessor",
          method: "tools/call:algebrus.solve",
          timestamp_ms: Date.now(),
          result: { backend: "cpu", computation_time_ms: 1.0, precision: "fp64" },
        },
      });

      // Refresh to get updated counts
      await bridge.refresh();

      const lastCall = updateSpy.mock.calls[updateSpy.mock.calls.length - 1][0] as MathPanelData;
      const algebrusChip = lastCall.chips.find((c) => c.name === "ALGEBRUS");
      expect(algebrusChip?.opCount).toBe(2);
    });
  });

  describe("destroy()", () => {
    it("stops polling", async () => {
      mockInvoke.mockResolvedValue(makeCapabilitiesResponse());
      bridge = new MathBridge({ panel, pollIntervalMs: 1000 });
      await bridge.start();

      bridge.destroy();

      mockInvoke.mockClear();
      vi.advanceTimersByTime(5000);
      expect(mockInvoke).not.toHaveBeenCalled();
    });

    it("removes trace listener", async () => {
      mockInvoke.mockResolvedValue(makeCapabilitiesResponse());
      bridge = new MathBridge({ panel });
      await bridge.start();

      bridge.destroy();
      expect(mockUnlisten).toHaveBeenCalled();
    });

    it("prevents further refreshes", async () => {
      mockInvoke.mockResolvedValue(makeCapabilitiesResponse());
      bridge = new MathBridge({ panel });
      await bridge.start();

      bridge.destroy();
      mockInvoke.mockClear();

      await bridge.refresh();
      expect(mockInvoke).not.toHaveBeenCalled();
    });
  });

  describe("CPU backend fallback detection", () => {
    it("detects CPU-only chip as cpu backend", async () => {
      mockInvoke.mockResolvedValue(makeCapabilitiesResponse());
      const updateSpy = vi.spyOn(panel, "update");

      bridge = new MathBridge({ panel });
      await bridge.start();

      const data: MathPanelData = updateSpy.mock.calls[0][0];
      const fourier = data.chips.find((c) => c.name === "FOURIER");
      expect(fourier?.backend).toBe("cpu");
    });

    it("detects GPU-accelerated chip as gpu backend", async () => {
      mockInvoke.mockResolvedValue(makeCapabilitiesResponse());
      const updateSpy = vi.spyOn(panel, "update");

      bridge = new MathBridge({ panel });
      await bridge.start();

      const data: MathPanelData = updateSpy.mock.calls[0][0];
      const symbex = data.chips.find((c) => c.name === "SYMBEX");
      expect(symbex?.backend).toBe("gpu");
    });
  });
});
