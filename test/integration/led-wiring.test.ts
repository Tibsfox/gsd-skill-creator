import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  LedBridge,
  type LedPanelPort,
} from "../../desktop/src/pipeline/led-bridge.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockLedPanel(): LedPanelPort & {
  setServiceState: ReturnType<typeof vi.fn>;
} {
  const states = new Map<string, { status: string; ledColor: string }>();
  return {
    setServiceState: vi.fn(
      (serviceId: string, status: string, ledColor: string) => {
        states.set(serviceId, { status, ledColor });
      },
    ),
    getAllStates: () => states,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("LedBridge wiring (Service state -> LED panel)", () => {
  let ledPanel: ReturnType<typeof createMockLedPanel>;
  let bridge: LedBridge;

  beforeEach(() => {
    ledPanel = createMockLedPanel();
    bridge = new LedBridge({ ledPanel });
  });

  it("state change updates LED panel", () => {
    bridge.handleStateChange({
      service_id: "tmux",
      from_status: "offline",
      to_status: "online",
      led_color: "green",
    });

    expect(ledPanel.setServiceState).toHaveBeenCalledWith(
      "tmux",
      "online",
      "green",
    );
  });

  it("multiple services tracked independently", () => {
    bridge.handleStateChange({
      service_id: "tmux",
      from_status: "offline",
      to_status: "online",
      led_color: "green",
    });
    bridge.handleStateChange({
      service_id: "claude",
      from_status: "offline",
      to_status: "starting",
      led_color: "amber",
    });
    bridge.handleStateChange({
      service_id: "watcher",
      from_status: "online",
      to_status: "failed",
      led_color: "red",
    });

    const states = ledPanel.getAllStates();
    expect(states.get("tmux")).toEqual({ status: "online", ledColor: "green" });
    expect(states.get("claude")).toEqual({
      status: "starting",
      ledColor: "amber",
    });
    expect(states.get("watcher")).toEqual({
      status: "failed",
      ledColor: "red",
    });
  });

  it("LED color mapping correctness (SVC-06)", () => {
    const mappings = [
      { status: "offline", led_color: "red" },
      { status: "starting", led_color: "amber" },
      { status: "online", led_color: "green" },
      { status: "degraded", led_color: "amber-blink" },
      { status: "failed", led_color: "red-blink" },
    ];

    for (const { status, led_color } of mappings) {
      bridge.handleStateChange({
        service_id: "test-svc",
        from_status: "offline",
        to_status: status,
        led_color,
      });

      const state = ledPanel.getAllStates().get("test-svc");
      expect(state?.ledColor).toBe(led_color);
    }
  });

  it("initial state load populates LED panel", async () => {
    const mockGetServiceStates = vi.fn().mockResolvedValue([
      { service_id: "tmux", status: "online", led_color: "green" },
      { service_id: "claude", status: "starting", led_color: "amber" },
      { service_id: "watcher", status: "offline", led_color: "red" },
    ]);

    await bridge.loadInitialStates(mockGetServiceStates);

    expect(mockGetServiceStates).toHaveBeenCalled();
    expect(ledPanel.setServiceState).toHaveBeenCalledWith(
      "tmux",
      "online",
      "green",
    );
    expect(ledPanel.setServiceState).toHaveBeenCalledWith(
      "claude",
      "starting",
      "amber",
    );
    expect(ledPanel.setServiceState).toHaveBeenCalledWith(
      "watcher",
      "offline",
      "red",
    );
  });

  it("bridge cleanup unsubscribes", () => {
    bridge.destroy();

    // After destroy, handleStateChange should be a no-op
    bridge.handleStateChange({
      service_id: "tmux",
      from_status: "offline",
      to_status: "online",
      led_color: "green",
    });

    expect(ledPanel.setServiceState).not.toHaveBeenCalled();
  });
});
