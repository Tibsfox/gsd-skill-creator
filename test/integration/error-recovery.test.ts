import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  ErrorRecoveryManager,
  type ServiceFailedPayload,
} from "../../desktop/src/pipeline/error-recovery.js";
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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ErrorRecoveryManager (service failure detection and guided recovery)", () => {
  let chatRenderer: ReturnType<typeof createMockChatRenderer>;
  let ledPanel: ReturnType<typeof createMockLedPanel>;
  let restartService: ReturnType<typeof vi.fn>;
  let recovery: ErrorRecoveryManager;

  beforeEach(() => {
    chatRenderer = createMockChatRenderer();
    ledPanel = createMockLedPanel();
    restartService = vi.fn(async () => ({ ok: true }));
    recovery = new ErrorRecoveryManager({
      chatRenderer,
      ledPanel,
      restartService,
    });
  });

  it("service failure detected via IPC event", () => {
    recovery.handleServiceFailed({
      service_id: "tmux",
      error: "Session killed",
      restart_available: true,
    });

    // LED updated to red
    expect(ledPanel.setServiceState).toHaveBeenCalledWith(
      "tmux",
      "failed",
      "red",
    );

    // Error shown in chat
    expect(chatRenderer.showError).toHaveBeenCalledWith(
      expect.stringContaining("tmux"),
      true,
    );

    // Recovery guidance shown
    expect(chatRenderer.appendMessage).toHaveBeenCalledWith(
      "system",
      expect.stringContaining("/restart tmux"),
    );
  });

  it("user triggers recovery via /restart command", async () => {
    recovery.handleServiceFailed({
      service_id: "tmux",
      error: "Session killed",
      restart_available: true,
    });

    const handled = await recovery.handleRecoveryCommand("/restart tmux");

    expect(handled).toBe(true);
    expect(restartService).toHaveBeenCalledWith("tmux");
  });

  it("successful recovery restores LED after state change", () => {
    recovery.handleServiceFailed({
      service_id: "tmux",
      error: "Session killed",
      restart_available: true,
    });

    // Simulate service coming back online
    recovery.handleServiceRecovered("tmux");

    expect(ledPanel.setServiceState).toHaveBeenCalledWith(
      "tmux",
      "online",
      "green",
    );
    expect(chatRenderer.appendMessage).toHaveBeenCalledWith(
      "system",
      expect.stringContaining("recovered"),
    );
  });

  it("full error recovery cycle (INTEG-06)", async () => {
    // Step 1: Service fails
    recovery.handleServiceFailed({
      service_id: "tmux",
      error: "Session killed",
      restart_available: true,
    });

    // Verify error shown
    expect(chatRenderer.showError).toHaveBeenCalled();
    expect(ledPanel.setServiceState).toHaveBeenCalledWith(
      "tmux",
      "failed",
      "red",
    );

    // Step 2: User triggers recovery
    await recovery.handleRecoveryCommand("/restart tmux");
    expect(restartService).toHaveBeenCalledWith("tmux");

    // Step 3: Service comes back online
    recovery.handleServiceRecovered("tmux");
    expect(ledPanel.setServiceState).toHaveBeenCalledWith(
      "tmux",
      "online",
      "green",
    );

    // No more failed services
    expect(recovery.getFailedServices()).toEqual([]);
  });

  it("non-recoverable failure shows different guidance", () => {
    recovery.handleServiceFailed({
      service_id: "watcher",
      error: "Fatal initialization error",
      restart_available: false,
    });

    // Guidance mentions bootstrap.sh, not /restart
    expect(chatRenderer.appendMessage).toHaveBeenCalledWith(
      "system",
      expect.stringContaining("bootstrap.sh"),
    );
    expect(chatRenderer.appendMessage).not.toHaveBeenCalledWith(
      "system",
      expect.stringContaining("/restart watcher"),
    );
  });

  it("multiple simultaneous failures handled independently", () => {
    recovery.handleServiceFailed({
      service_id: "tmux",
      error: "Session killed",
      restart_available: true,
    });
    recovery.handleServiceFailed({
      service_id: "claude",
      error: "Process crashed",
      restart_available: true,
    });

    // Both errors shown
    expect(chatRenderer.showError).toHaveBeenCalledTimes(2);

    // Both LEDs updated
    expect(ledPanel.setServiceState).toHaveBeenCalledWith(
      "tmux",
      "failed",
      "red",
    );
    expect(ledPanel.setServiceState).toHaveBeenCalledWith(
      "claude",
      "failed",
      "red",
    );

    // Both tracked
    expect(recovery.getFailedServices()).toEqual(
      expect.arrayContaining(["tmux", "claude"]),
    );
    expect(recovery.getFailedServices()).toHaveLength(2);
  });
});
