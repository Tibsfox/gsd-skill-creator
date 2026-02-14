import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { randomFillSync } from "node:crypto";
import { mockIPC, clearMocks } from "@tauri-apps/api/mocks";
import { greet, echoCommand } from "./commands";

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
