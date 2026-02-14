import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { randomFillSync } from "node:crypto";
import { mockIPC, clearMocks } from "@tauri-apps/api/mocks";
import { ptyOpen, ptyWrite, ptyResize, ptyPause, ptyResume, ptyClose } from "./pty-bridge";

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

describe("ptyOpen", () => {
  it("invokes pty_open with correct args and receives channel data", async () => {
    const receivedChunks: Uint8Array[] = [];

    mockIPC((cmd, payload) => {
      if (cmd === "pty_open") {
        const args = payload as Record<string, unknown>;
        expect(args.id).toBe("test-session");
        expect(args.cols).toBe(80);
        expect(args.rows).toBe(24);

        // Simulate PTY output via Channel
        const channelObj = args.onData as { id: number };
        const channelId = channelObj.id;
        const bytes = [72, 101, 108, 108, 111]; // "Hello"
        window.__TAURI_INTERNALS__.runCallback(channelId, {
          index: 0,
          message: bytes,
        });
      }
    });

    await ptyOpen(
      { id: "test-session", cols: 80, rows: 24 },
      (data) => { receivedChunks.push(data); },
    );

    expect(receivedChunks).toHaveLength(1);
    expect(receivedChunks[0]).toBeInstanceOf(Uint8Array);
    expect(Array.from(receivedChunks[0])).toEqual([72, 101, 108, 108, 111]);
  });

  it("normalizes channel data to Uint8Array from number[]", async () => {
    const receivedChunks: Uint8Array[] = [];

    mockIPC((cmd, payload) => {
      if (cmd === "pty_open") {
        const args = payload as Record<string, unknown>;
        const channelObj = args.onData as { id: number };
        const channelId = channelObj.id;

        // Send data as number[] (small payload JSON format from Tauri)
        window.__TAURI_INTERNALS__.runCallback(channelId, {
          index: 0,
          message: [0x41, 0x42, 0x43],
        });
      }
    });

    await ptyOpen(
      { id: "normalize-test", cols: 80, rows: 24 },
      (data) => { receivedChunks.push(data); },
    );

    expect(receivedChunks).toHaveLength(1);
    // Must be Uint8Array regardless of input encoding
    expect(receivedChunks[0]).toBeInstanceOf(Uint8Array);
    expect(receivedChunks[0][0]).toBe(0x41);
    expect(receivedChunks[0][1]).toBe(0x42);
    expect(receivedChunks[0][2]).toBe(0x43);
  });
});

describe("ptyWrite", () => {
  it("invokes pty_write with session id and data string", async () => {
    const capturedArgs: Record<string, unknown>[] = [];

    mockIPC((cmd, payload) => {
      if (cmd === "pty_write") {
        capturedArgs.push(payload as Record<string, unknown>);
      }
    });

    await ptyWrite("session-1", "ls -la\n");

    expect(capturedArgs).toHaveLength(1);
    expect(capturedArgs[0].id).toBe("session-1");
    expect(capturedArgs[0].data).toBe("ls -la\n");
  });
});

describe("ptyResize", () => {
  it("invokes pty_resize with session id, cols, rows", async () => {
    const capturedArgs: Record<string, unknown>[] = [];

    mockIPC((cmd, payload) => {
      if (cmd === "pty_resize") {
        capturedArgs.push(payload as Record<string, unknown>);
      }
    });

    await ptyResize("session-1", 120, 40);

    expect(capturedArgs).toHaveLength(1);
    expect(capturedArgs[0].id).toBe("session-1");
    expect(capturedArgs[0].cols).toBe(120);
    expect(capturedArgs[0].rows).toBe(40);
  });
});

describe("ptyPause", () => {
  it("invokes pty_pause with session id", async () => {
    const capturedArgs: Record<string, unknown>[] = [];

    mockIPC((cmd, payload) => {
      if (cmd === "pty_pause") {
        capturedArgs.push(payload as Record<string, unknown>);
      }
    });

    await ptyPause("session-1");

    expect(capturedArgs).toHaveLength(1);
    expect(capturedArgs[0].id).toBe("session-1");
  });
});

describe("ptyResume", () => {
  it("invokes pty_resume with session id", async () => {
    const capturedArgs: Record<string, unknown>[] = [];

    mockIPC((cmd, payload) => {
      if (cmd === "pty_resume") {
        capturedArgs.push(payload as Record<string, unknown>);
      }
    });

    await ptyResume("session-1");

    expect(capturedArgs).toHaveLength(1);
    expect(capturedArgs[0].id).toBe("session-1");
  });
});

describe("ptyClose", () => {
  it("invokes pty_close with session id", async () => {
    const capturedArgs: Record<string, unknown>[] = [];

    mockIPC((cmd, payload) => {
      if (cmd === "pty_close") {
        capturedArgs.push(payload as Record<string, unknown>);
      }
    });

    await ptyClose("session-1");

    expect(capturedArgs).toHaveLength(1);
    expect(capturedArgs[0].id).toBe("session-1");
  });
});
