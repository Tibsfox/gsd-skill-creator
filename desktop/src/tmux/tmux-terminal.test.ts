import { describe, it, expect, vi, beforeEach } from "vitest";

// -- Mock storage: capture callbacks registered by the Terminal instance --
let storedOnDataCb: ((data: string) => void) | null = null;
let storedOnResizeCb: ((size: { cols: number; rows: number }) => void) | null = null;
const mockDispose = vi.fn();
const mockOpen = vi.fn();
const mockLoadAddon = vi.fn();
const mockWrite = vi.fn(
  (_data: Uint8Array | string, callback?: () => void) => {
    if (callback) callback();
  },
);
let termConstructorArgs: Record<string, unknown> | null = null;

// -- Mock @xterm/xterm --
vi.mock("@xterm/xterm", () => ({
  Terminal: vi.fn().mockImplementation((options: Record<string, unknown>) => {
    termConstructorArgs = options;
    return {
      open: mockOpen,
      write: mockWrite,
      loadAddon: mockLoadAddon,
      dispose: mockDispose,
      cols: 80,
      rows: 24,
      onData: vi.fn((cb: (data: string) => void) => {
        storedOnDataCb = cb;
        return { dispose: vi.fn() };
      }),
      onResize: vi.fn(
        (cb: (size: { cols: number; rows: number }) => void) => {
          storedOnResizeCb = cb;
          return { dispose: vi.fn() };
        },
      ),
    };
  }),
}));

// -- Mock @xterm/addon-fit --
const mockFit = vi.fn();
vi.mock("@xterm/addon-fit", () => ({
  FitAddon: vi.fn().mockImplementation(() => ({
    fit: mockFit,
    dispose: vi.fn(),
  })),
}));

// -- Mock @xterm/addon-webgl --
vi.mock("@xterm/addon-webgl", () => ({
  WebglAddon: vi.fn().mockImplementation(() => ({
    dispose: vi.fn(),
  })),
}));

// -- Mock @xterm/addon-web-links --
vi.mock("@xterm/addon-web-links", () => ({
  WebLinksAddon: vi.fn().mockImplementation(() => ({
    dispose: vi.fn(),
  })),
}));

// -- Mock pty-bridge --
const mockPtyOpen = vi.fn().mockResolvedValue(undefined);
const mockPtyWrite = vi.fn().mockResolvedValue(undefined);
const mockPtyResize = vi.fn().mockResolvedValue(undefined);
const mockPtyPause = vi.fn().mockResolvedValue(undefined);
const mockPtyResume = vi.fn().mockResolvedValue(undefined);
const mockPtyClose = vi.fn().mockResolvedValue(undefined);

vi.mock("../terminal/pty-bridge", () => ({
  ptyOpen: (...args: unknown[]) => mockPtyOpen(...args),
  ptyWrite: (...args: unknown[]) => mockPtyWrite(...args),
  ptyResize: (...args: unknown[]) => mockPtyResize(...args),
  ptyPause: (...args: unknown[]) => mockPtyPause(...args),
  ptyResume: (...args: unknown[]) => mockPtyResume(...args),
  ptyClose: (...args: unknown[]) => mockPtyClose(...args),
}));

// -- Mock tmux-bridge --
const mockTmuxEnsureSession = vi.fn().mockResolvedValue(
  ["tmux", "attach-session", "-t", "gsd"],
);

vi.mock("./tmux-bridge", () => ({
  tmuxEnsureSession: (...args: unknown[]) => mockTmuxEnsureSession(...args),
}));

// -- Mock flow-control --
const mockFlowWrite = vi.fn();
const mockFlowGetState = vi.fn().mockReturnValue({
  paused: false,
  pendingCallbacks: 0,
  written: 0,
});

vi.mock("../terminal/flow-control", () => ({
  FlowController: vi.fn().mockImplementation(() => ({
    write: mockFlowWrite,
    getState: mockFlowGetState,
  })),
}));

// -- Mock ResizeObserver --
const mockObserve = vi.fn();
const mockDisconnect = vi.fn();
vi.stubGlobal(
  "ResizeObserver",
  vi.fn().mockImplementation(() => ({
    observe: mockObserve,
    unobserve: vi.fn(),
    disconnect: mockDisconnect,
  })),
);

// -- Import after mocks are registered --
import { createTmuxTerminal } from "./tmux-terminal";

describe("tmux-terminal", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    vi.clearAllMocks();
    storedOnDataCb = null;
    storedOnResizeCb = null;
    termConstructorArgs = null;
    container = document.createElement("div");
    // Reset mockTmuxEnsureSession to default return value
    mockTmuxEnsureSession.mockResolvedValue(
      ["tmux", "attach-session", "-t", "gsd"],
    );
  });

  it("calls tmuxEnsureSession with correct session name", async () => {
    const handle = await createTmuxTerminal(container, "tmux-session-1");

    expect(mockTmuxEnsureSession).toHaveBeenCalledWith("gsd");
    expect(handle.sessionName).toBe("gsd");
  });

  it("uses custom session name from config", async () => {
    mockTmuxEnsureSession.mockResolvedValue(
      ["tmux", "attach-session", "-t", "custom"],
    );

    const handle = await createTmuxTerminal(container, "tmux-session-2", {
      sessionName: "custom",
    });

    expect(mockTmuxEnsureSession).toHaveBeenCalledWith("custom");
    expect(handle.sessionName).toBe("custom");
  });

  it("passes tmux attach command to ptyOpen as shell + args", async () => {
    await createTmuxTerminal(container, "tmux-session-3");

    expect(mockPtyOpen).toHaveBeenCalledOnce();
    const [params] = mockPtyOpen.mock.calls[0];
    expect(params.id).toBe("tmux-session-3");
    expect(params.shell).toBe("tmux");
    expect(params.args).toEqual(["attach-session", "-t", "gsd"]);
    expect(params.cols).toBe(80);
    expect(params.rows).toBe(24);
  });

  it("detach sends tmux detach key sequence before closing", async () => {
    const handle = await createTmuxTerminal(container, "tmux-session-4");

    await handle.detach();

    // Ctrl-B followed by 'd' for tmux detach
    expect(mockPtyWrite).toHaveBeenCalledWith("tmux-session-4", "\x02d");
  });

  it("dispose detaches then closes PTY", async () => {
    const handle = await createTmuxTerminal(container, "tmux-session-5");

    await handle.dispose();

    // First: detach from tmux
    expect(mockPtyWrite).toHaveBeenCalledWith("tmux-session-5", "\x02d");
    // Then: close the PTY
    expect(mockPtyClose).toHaveBeenCalledWith("tmux-session-5");
    // And dispose xterm.js
    expect(mockDispose).toHaveBeenCalledOnce();
    // ResizeObserver disconnected
    expect(mockDisconnect).toHaveBeenCalledOnce();
  });
});
