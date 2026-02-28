import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  ChatPipeline,
  type ChatRendererPort,
  type MagicFilterPort,
} from "../../desktop/src/pipeline/chat-pipeline.js";

// ---------------------------------------------------------------------------
// Helpers: mock ports
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

function createMockMagicFilter(level = 3): MagicFilterPort & {
  shouldRender: ReturnType<typeof vi.fn>;
  setLevel: ReturnType<typeof vi.fn>;
} {
  let currentLevel = level;
  const shouldRender = vi.fn((eventType: string) => {
    // Chat events always pass per MAGIC-04
    if (eventType.startsWith("chat:")) return true;
    // Level 1 blocks most system events
    if (currentLevel === 1) return false;
    // Level 5 shows everything
    if (currentLevel === 5) return true;
    // Default: show
    return true;
  });
  return {
    getLevel: () => currentLevel,
    setLevel: vi.fn((l: number) => {
      currentLevel = l;
    }),
    shouldRender,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ChatPipeline wiring (API -> Magic -> Chat)", () => {
  let chatRenderer: ReturnType<typeof createMockChatRenderer>;
  let magicFilter: ReturnType<typeof createMockMagicFilter>;
  let pipeline: ChatPipeline;

  beforeEach(() => {
    chatRenderer = createMockChatRenderer();
    magicFilter = createMockMagicFilter(3);
    pipeline = new ChatPipeline({ magicFilter, chatRenderer });
  });

  it("delta flows through to chat renderer", () => {
    pipeline.handleEvent("chat:delta", {
      conversation_id: "test",
      delta: "Hello",
      index: 0,
    });

    expect(chatRenderer.appendDelta).toHaveBeenCalledWith("Hello");
  });

  it("magic filter blocks system events at level 1", () => {
    magicFilter.setLevel(1);
    pipeline.handleEvent("service:stdout", { message: "debug info" });

    expect(chatRenderer.appendDelta).not.toHaveBeenCalled();
    expect(chatRenderer.appendMessage).not.toHaveBeenCalled();
  });

  it("chat events always pass regardless of magic level (MAGIC-04)", () => {
    magicFilter.setLevel(1);
    pipeline.handleEvent("chat:delta", {
      conversation_id: "test",
      delta: "Hello from level 1",
      index: 0,
    });

    expect(chatRenderer.appendDelta).toHaveBeenCalledWith("Hello from level 1");
  });

  it("complete message flow: start -> deltas -> complete", () => {
    pipeline.handleEvent("chat:start", { conversation_id: "test" });
    expect(chatRenderer.setInputEnabled).toHaveBeenCalledWith(false);

    pipeline.handleEvent("chat:delta", {
      conversation_id: "test",
      delta: "A",
      index: 0,
    });
    pipeline.handleEvent("chat:delta", {
      conversation_id: "test",
      delta: "B",
      index: 1,
    });
    pipeline.handleEvent("chat:delta", {
      conversation_id: "test",
      delta: "C",
      index: 2,
    });

    expect(chatRenderer.appendDelta).toHaveBeenCalledTimes(3);

    pipeline.handleEvent("chat:complete", {
      conversation_id: "test",
      stop_reason: "end_turn",
    });
    expect(chatRenderer.setInputEnabled).toHaveBeenCalledWith(true);
  });

  it("error event shows error in chat", () => {
    pipeline.handleEvent("chat:error", {
      conversation_id: "test",
      error: "Network failed",
      recoverable: true,
    });

    expect(chatRenderer.showError).toHaveBeenCalledWith("Network failed", true);
  });

  it("retry event shows retry in chat", () => {
    pipeline.handleEvent("chat:retry", {
      conversation_id: "test",
      attempt: 1,
      max_attempts: 3,
      delay_ms: 1000,
    });

    expect(chatRenderer.showRetry).toHaveBeenCalledWith(1, 3);
  });

  it("pipeline cleanup unsubscribes from events", () => {
    // handleEvent is synchronous, so no subscriptions to unsubscribe for the
    // direct-call path. But the destroy method should clear internal state.
    pipeline.destroy();

    // After destroy, events should be no-ops
    pipeline.handleEvent("chat:delta", {
      conversation_id: "test",
      delta: "after destroy",
      index: 0,
    });

    // If pipeline properly guards destroyed state, this should not fire
    // (or the chatRenderer call count should still be 0)
    expect(chatRenderer.appendDelta).not.toHaveBeenCalled();
  });
});
