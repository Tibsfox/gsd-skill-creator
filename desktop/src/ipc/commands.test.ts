import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { randomFillSync } from "node:crypto";
import { mockIPC, clearMocks } from "@tauri-apps/api/mocks";
import {
  greet,
  echoCommand,
  sendChatMessage,
  getServiceStates,
  setMagicLevel,
  getMagicLevel,
  getConversationHistory,
  startService,
  stopService,
  restartService,
  getStagingStatus,
} from "./commands";
import {
  onChatDelta,
  onChatError,
  onServiceStateChange,
  onMagicLevelChanged,
  onStagingQuarantine,
} from "./events";

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

describe("greet command", () => {
  it("returns typed response with message and timestamp", async () => {
    mockIPC((cmd, payload) => {
      if (cmd === "greet") {
        const args = payload as Record<string, unknown>;
        return {
          message: `Hello, ${args.name}! From Rust.`,
          timestamp: 1700000000000,
        };
      }
    });

    const response = await greet("World");

    expect(response).toEqual({
      message: "Hello, World! From Rust.",
      timestamp: 1700000000000,
    });
    expect(typeof response.message).toBe("string");
    expect(typeof response.timestamp).toBe("number");
  });

  it("handles error from backend", async () => {
    mockIPC((cmd) => {
      if (cmd === "greet") {
        throw new Error("backend failure");
      }
    });

    await expect(greet("Fail")).rejects.toThrow();
  });
});

describe("echoCommand", () => {
  it("invokes echo_event and returns the message", async () => {
    mockIPC((cmd, payload) => {
      if (cmd === "echo_event") {
        const args = payload as Record<string, unknown>;
        return args.message;
      }
    });

    const result = await echoCommand("hello");
    expect(result).toBe("hello");
  });
});

// ============================================================================
// GSD-OS IPC command wrapper tests (Phase 375-02)
// ============================================================================

describe("sendChatMessage", () => {
  it("invokes send_chat_message with message and conversation_id", async () => {
    mockIPC((cmd, payload) => {
      if (cmd === "send_chat_message") {
        return { conversation_id: "conv-123" };
      }
    });

    const result = await sendChatMessage("Hello Claude", "conv-123");
    expect(result).toEqual({ conversation_id: "conv-123" });
  });

  it("works without conversation_id", async () => {
    mockIPC((cmd) => {
      if (cmd === "send_chat_message") {
        return { conversation_id: "new-conv" };
      }
    });

    const result = await sendChatMessage("Hello");
    expect(result).toEqual({ conversation_id: "new-conv" });
  });
});

describe("getServiceStates", () => {
  it("invokes get_service_states and returns array", async () => {
    const mockStates = [
      { service_id: "claude", status: "online", led_color: "#00ff00" },
    ];
    mockIPC((cmd) => {
      if (cmd === "get_service_states") {
        return mockStates;
      }
    });

    const result = await getServiceStates();
    expect(result).toEqual(mockStates);
  });
});

describe("setMagicLevel", () => {
  it("invokes set_magic_level with level", async () => {
    mockIPC((cmd, payload) => {
      if (cmd === "set_magic_level") {
        const args = payload as Record<string, unknown>;
        return { level: args.level, previous_level: 3 };
      }
    });

    const result = await setMagicLevel(4);
    expect(result).toEqual({ level: 4, previous_level: 3 });
  });
});

describe("getMagicLevel", () => {
  it("invokes get_magic_level and returns level", async () => {
    mockIPC((cmd) => {
      if (cmd === "get_magic_level") {
        return { level: 3 };
      }
    });

    const result = await getMagicLevel();
    expect(result).toEqual({ level: 3 });
  });
});

describe("getConversationHistory", () => {
  it("invokes get_conversation_history with conversation_id", async () => {
    const mockHistory = { messages: [{ role: "user", content: "Hi" }] };
    mockIPC((cmd) => {
      if (cmd === "get_conversation_history") {
        return mockHistory;
      }
    });

    const result = await getConversationHistory("conv-1");
    expect(result).toEqual(mockHistory);
  });
});

describe("startService", () => {
  it("invokes start_service with service_id", async () => {
    mockIPC((cmd) => {
      if (cmd === "start_service") {
        return { ok: true };
      }
    });

    const result = await startService("claude");
    expect(result).toEqual({ ok: true });
  });
});

describe("stopService", () => {
  it("invokes stop_service with service_id", async () => {
    mockIPC((cmd) => {
      if (cmd === "stop_service") {
        return { ok: true };
      }
    });

    const result = await stopService("claude");
    expect(result).toEqual({ ok: true });
  });
});

describe("restartService", () => {
  it("invokes restart_service with service_id", async () => {
    mockIPC((cmd) => {
      if (cmd === "restart_service") {
        return { ok: true };
      }
    });

    const result = await restartService("claude");
    expect(result).toEqual({ ok: true });
  });
});

describe("getStagingStatus", () => {
  it("invokes get_staging_status and returns counts", async () => {
    mockIPC((cmd) => {
      if (cmd === "get_staging_status") {
        return { intake_count: 2, processing_count: 1, quarantine_count: 0 };
      }
    });

    const result = await getStagingStatus();
    expect(result).toEqual({
      intake_count: 2,
      processing_count: 1,
      quarantine_count: 0,
    });
  });
});

// ============================================================================
// GSD-OS IPC event listener existence tests (Phase 375-02)
// ============================================================================

describe("IPC event listeners", () => {
  it("onChatDelta is a function", () => {
    expect(typeof onChatDelta).toBe("function");
  });

  it("onChatError is a function", () => {
    expect(typeof onChatError).toBe("function");
  });

  it("onServiceStateChange is a function", () => {
    expect(typeof onServiceStateChange).toBe("function");
  });

  it("onMagicLevelChanged is a function", () => {
    expect(typeof onMagicLevelChanged).toBe("function");
  });

  it("onStagingQuarantine is a function", () => {
    expect(typeof onStagingQuarantine).toBe("function");
  });
});
