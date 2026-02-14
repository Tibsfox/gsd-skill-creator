import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { randomFillSync } from "node:crypto";
import { mockIPC, clearMocks } from "@tauri-apps/api/mocks";
import { claudeStart, claudeStop, claudeList, claudeStatus } from "./claude-bridge";
import type { ClaudeSessionInfo } from "./types";

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

const makeSession = (overrides: Partial<ClaudeSessionInfo> = {}): ClaudeSessionInfo => ({
  id: "sess-001",
  tmux_window: "claude-0",
  status: "active",
  started_at: 1707900000,
  last_activity: 1707900100,
  project_dir: "/home/user/project",
  ...overrides,
});

describe("claudeStart", () => {
  it("invokes claude_start with project dir", async () => {
    const expected = makeSession();
    const handler = vi.fn();

    mockIPC((cmd, payload) => {
      if (cmd === "claude_start") {
        handler(payload);
        return expected;
      }
    });

    const result = await claudeStart("/home/user/project");

    expect(handler).toHaveBeenCalledWith({
      projectDir: "/home/user/project",
    });
    expect(result).toEqual(expected);
  });

  it("passes null when no project dir", async () => {
    const expected = makeSession({ project_dir: null });
    const handler = vi.fn();

    mockIPC((cmd, payload) => {
      if (cmd === "claude_start") {
        handler(payload);
        return expected;
      }
    });

    const result = await claudeStart();

    expect(handler).toHaveBeenCalledWith({ projectDir: null });
    expect(result.project_dir).toBeNull();
  });
});

describe("claudeStop", () => {
  it("invokes claude_stop with session id", async () => {
    const handler = vi.fn();

    mockIPC((cmd, payload) => {
      if (cmd === "claude_stop") {
        handler(payload);
        return undefined;
      }
    });

    await claudeStop("sess-001");

    expect(handler).toHaveBeenCalledWith({ id: "sess-001" });
  });
});

describe("claudeList", () => {
  it("invokes claude_list and returns sessions array", async () => {
    const sessions = [
      makeSession({ id: "sess-001" }),
      makeSession({ id: "sess-002", status: "idle" }),
    ];

    mockIPC((cmd) => {
      if (cmd === "claude_list") return sessions;
    });

    const result = await claudeList();

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("sess-001");
    expect(result[1].status).toBe("idle");
  });

  it("returns empty array when no sessions", async () => {
    mockIPC((cmd) => {
      if (cmd === "claude_list") return [];
    });

    const result = await claudeList();

    expect(result).toEqual([]);
  });
});

describe("claudeStatus", () => {
  it("invokes claude_status and returns session info", async () => {
    const expected = makeSession({ status: "paused" });
    const handler = vi.fn();

    mockIPC((cmd, payload) => {
      if (cmd === "claude_status") {
        handler(payload);
        return expected;
      }
    });

    const result = await claudeStatus("sess-001");

    expect(handler).toHaveBeenCalledWith({ id: "sess-001" });
    expect(result.status).toBe("paused");
  });
});
