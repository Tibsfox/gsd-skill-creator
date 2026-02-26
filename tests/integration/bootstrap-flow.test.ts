import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  BootstrapFlow,
  type IpcCommandsPort,
  type BootstrapStage,
} from "../../desktop/src/pipeline/bootstrap-flow.js";
import type { ChatRendererPort } from "../../desktop/src/pipeline/chat-pipeline.js";
import type { LedPanelPort } from "../../desktop/src/pipeline/led-bridge.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockChatRenderer(): ChatRendererPort & {
  appendDelta: ReturnType<typeof vi.fn>;
  appendMessage: ReturnType<typeof vi.fn>;
  showError: ReturnType<typeof vi.fn>;
  showRetry: ReturnType<typeof vi.fn>;
  setInputEnabled: ReturnType<typeof vi.fn>;
  showReady: ReturnType<typeof vi.fn>;
} {
  return {
    appendDelta: vi.fn(),
    appendMessage: vi.fn(),
    showError: vi.fn(),
    showRetry: vi.fn(),
    setInputEnabled: vi.fn(),
    showReady: vi.fn(),
  };
}

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

/**
 * Create mock IPC commands for bootstrap. By default, all services start
 * successfully and the API key is present.
 */
function createMockIpc(overrides?: Partial<IpcCommandsPort>): IpcCommandsPort {
  // Track which services have been "started"
  const startedServices = new Set<string>();

  const base: IpcCommandsPort = {
    startService: vi.fn(async (serviceId: string) => {
      startedServices.add(serviceId);
      return { ok: true };
    }),
    getServiceStates: vi.fn(async () => {
      // Return started services as online, others as offline
      const allServices = [
        "tmux",
        "claude",
        "file_watcher",
        "dashboard",
        "console",
        "staging",
        "terminal",
      ];
      return allServices.map((id) => ({
        service_id: id,
        status: startedServices.has(id) ? "online" : "offline",
        led_color: startedServices.has(id) ? "green" : "red",
      }));
    }),
    hasApiKey: vi.fn(async () => true),
    storeApiKey: vi.fn(async () => {}),
    getMagicLevel: vi.fn(async () => ({ level: 3 })),
  };

  return { ...base, ...overrides };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("BootstrapFlow (full bootstrap sequence)", () => {
  let chatRenderer: ReturnType<typeof createMockChatRenderer>;
  let ledPanel: ReturnType<typeof createMockLedPanel>;
  let ipc: IpcCommandsPort;
  let stages: BootstrapStage[];

  beforeEach(() => {
    chatRenderer = createMockChatRenderer();
    ledPanel = createMockLedPanel();
    ipc = createMockIpc();
    stages = [];
  });

  it("full bootstrap reaches READY with services in dependency order", async () => {
    const startOrder: string[] = [];
    ipc.startService = vi.fn(async (serviceId: string) => {
      startOrder.push(serviceId);
      return { ok: true };
    });

    const flow = new BootstrapFlow({
      chatRenderer,
      ledPanel,
      ipcCommands: ipc,
      onStageChange: (s) => stages.push(s),
    });

    await flow.run();

    // Services started in dependency order
    expect(startOrder).toEqual([
      "tmux",
      "claude",
      "file_watcher",
      "dashboard",
      "console",
      "staging",
      "terminal",
    ]);

    // LED panel updated for each service (starting then online)
    // 7 services x 2 updates each = 14 calls
    expect(ledPanel.setServiceState).toHaveBeenCalledTimes(14);

    // READY prompt shown
    expect(chatRenderer.showReady).toHaveBeenCalled();

    // Final stage is complete
    expect(flow.stage).toBe("complete");
  });

  it("reports stages progressively", async () => {
    const flow = new BootstrapFlow({
      chatRenderer,
      ledPanel,
      ipcCommands: ipc,
      onStageChange: (s) => stages.push(s),
    });

    await flow.run();

    expect(stages).toEqual([
      "prerequisites",
      "scaffold",
      "services",
      "api_key",
      "ready",
      "complete",
    ]);
  });

  it("handles missing API key by pausing at api_key stage", async () => {
    ipc.hasApiKey = vi.fn(async () => false);

    const flow = new BootstrapFlow({
      chatRenderer,
      ledPanel,
      ipcCommands: ipc,
      onStageChange: (s) => stages.push(s),
    });

    // Start bootstrap but don't await (it will pause at api_key)
    const runPromise = flow.run();

    // Wait for the flow to reach the api_key stage
    await vi.waitFor(() => {
      expect(stages).toContain("api_key");
    });

    // Provide the API key to resume
    flow.provideApiKey("sk-ant-test");

    await runPromise;

    expect(ipc.storeApiKey).toHaveBeenCalledWith("sk-ant-test");
    expect(chatRenderer.showReady).toHaveBeenCalled();
    expect(flow.stage).toBe("complete");
  });

  it("handles service start failure", async () => {
    ipc.startService = vi.fn(async (serviceId: string) => {
      if (serviceId === "claude") {
        return { ok: false, error: "Process not found" };
      }
      return { ok: true };
    });

    const flow = new BootstrapFlow({
      chatRenderer,
      ledPanel,
      ipcCommands: ipc,
      onStageChange: (s) => stages.push(s),
    });

    await flow.run();

    // Bootstrap did NOT reach READY
    expect(chatRenderer.showReady).not.toHaveBeenCalled();
    expect(flow.stage).toBe("failed");

    // Error shown in chat
    expect(chatRenderer.showError).toHaveBeenCalledWith(
      expect.stringContaining("claude"),
      true,
    );
  });

  it("all LEDs green at completion", async () => {
    const flow = new BootstrapFlow({
      chatRenderer,
      ledPanel,
      ipcCommands: ipc,
    });

    await flow.run();

    const states = ledPanel.getAllStates();
    for (const [, state] of states) {
      expect(state.ledColor).toBe("green");
      expect(state.status).toBe("online");
    }
  });

  it("idempotent: second run detects existing state", async () => {
    // First run: all services offline initially, then started
    const flow = new BootstrapFlow({
      chatRenderer,
      ledPanel,
      ipcCommands: ipc,
      onStageChange: (s) => stages.push(s),
    });

    await flow.run();
    chatRenderer.appendMessage.mockClear();
    chatRenderer.showReady.mockClear();
    (ipc.startService as ReturnType<typeof vi.fn>).mockClear();
    stages = [];

    // Second run: all services already online
    ipc.getServiceStates = vi.fn(async () => [
      { service_id: "tmux", status: "online", led_color: "green" },
      { service_id: "claude", status: "online", led_color: "green" },
      { service_id: "file_watcher", status: "online", led_color: "green" },
      { service_id: "dashboard", status: "online", led_color: "green" },
      { service_id: "console", status: "online", led_color: "green" },
      { service_id: "staging", status: "online", led_color: "green" },
      { service_id: "terminal", status: "online", led_color: "green" },
    ]);

    const flow2 = new BootstrapFlow({
      chatRenderer,
      ledPanel,
      ipcCommands: ipc,
      onStageChange: (s) => stages.push(s),
    });

    await flow2.run();

    // No services were started again
    expect(ipc.startService).not.toHaveBeenCalled();

    // "Services already online" message shown
    expect(chatRenderer.appendMessage).toHaveBeenCalledWith(
      "system",
      expect.stringContaining("already online"),
    );

    // READY shown
    expect(chatRenderer.showReady).toHaveBeenCalled();
    expect(flow2.stage).toBe("complete");
  });

  it("full bootstrap from fresh state with mock API (INTEG-04)", async () => {
    // This is the primary acceptance test: fresh directory -> READY

    const flow = new BootstrapFlow({
      chatRenderer,
      ledPanel,
      ipcCommands: ipc,
      onStageChange: (s) => stages.push(s),
    });

    await flow.run();

    // All stages hit
    expect(stages).toContain("prerequisites");
    expect(stages).toContain("scaffold");
    expect(stages).toContain("services");
    expect(stages).toContain("api_key");
    expect(stages).toContain("ready");
    expect(stages).toContain("complete");

    // All 7 services started
    expect(ipc.startService).toHaveBeenCalledTimes(7);

    // API key checked
    expect(ipc.hasApiKey).toHaveBeenCalled();

    // READY prompt shown
    expect(chatRenderer.showReady).toHaveBeenCalledTimes(1);
  });
});
