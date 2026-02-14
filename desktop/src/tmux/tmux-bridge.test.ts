import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { randomFillSync } from "node:crypto";
import { mockIPC, clearMocks } from "@tauri-apps/api/mocks";
import { tmuxHasTmux, tmuxListSessions, tmuxEnsureSession } from "./tmux-bridge";

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

describe("tmuxHasTmux", () => {
  it("invokes tmux_has_tmux and returns boolean", async () => {
    mockIPC((cmd) => {
      if (cmd === "tmux_has_tmux") return true;
    });
    const result = await tmuxHasTmux();
    expect(result).toBe(true);
  });

  it("returns false when tmux not installed", async () => {
    mockIPC((cmd) => {
      if (cmd === "tmux_has_tmux") return false;
    });
    const result = await tmuxHasTmux();
    expect(result).toBe(false);
  });
});

describe("tmuxListSessions", () => {
  it("invokes tmux_list_sessions and returns session array", async () => {
    const sessions = [
      { name: "gsd", created: "1707900000", attached: true, windows: 3 },
      { name: "dev", created: "1707800000", attached: false, windows: 1 },
    ];
    mockIPC((cmd) => {
      if (cmd === "tmux_list_sessions") return sessions;
    });
    const result = await tmuxListSessions();
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("gsd");
    expect(result[0].attached).toBe(true);
    expect(result[1].windows).toBe(1);
  });

  it("returns empty array when no sessions exist", async () => {
    mockIPC((cmd) => {
      if (cmd === "tmux_list_sessions") return [];
    });
    const result = await tmuxListSessions();
    expect(result).toEqual([]);
  });
});

describe("tmuxEnsureSession", () => {
  it("invokes tmux_ensure_session and returns attach command args", async () => {
    mockIPC((cmd, payload) => {
      if (cmd === "tmux_ensure_session") {
        const args = payload as Record<string, unknown>;
        expect(args.name).toBe("gsd");
        return ["tmux", "attach-session", "-t", "gsd"];
      }
    });
    const result = await tmuxEnsureSession("gsd");
    expect(result).toEqual(["tmux", "attach-session", "-t", "gsd"]);
  });
});
