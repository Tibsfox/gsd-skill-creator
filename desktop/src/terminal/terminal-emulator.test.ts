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
let webglShouldThrow = false;
vi.mock("@xterm/addon-webgl", () => ({
  WebglAddon: vi.fn().mockImplementation(() => {
    if (webglShouldThrow) {
      throw new Error("WebGL not supported");
    }
    return { dispose: vi.fn() };
  }),
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

vi.mock("./pty-bridge", () => ({
  ptyOpen: (...args: unknown[]) => mockPtyOpen(...args),
  ptyWrite: (...args: unknown[]) => mockPtyWrite(...args),
  ptyResize: (...args: unknown[]) => mockPtyResize(...args),
  ptyPause: (...args: unknown[]) => mockPtyPause(...args),
  ptyResume: (...args: unknown[]) => mockPtyResume(...args),
  ptyClose: (...args: unknown[]) => mockPtyClose(...args),
}));

// -- Mock flow-control --
const mockFlowWrite = vi.fn();
const mockFlowGetState = vi.fn().mockReturnValue({
  paused: false,
  pendingCallbacks: 0,
  written: 0,
});

vi.mock("./flow-control", () => ({
  FlowController: vi.fn().mockImplementation(() => ({
    write: mockFlowWrite,
    getState: mockFlowGetState,
  })),
}));

// -- Mock ResizeObserver (not available in jsdom) --
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
import { createTerminal } from "./terminal-emulator";
import { DEFAULT_TERMINAL_CONFIG } from "./types";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";

describe("terminal-emulator", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    vi.clearAllMocks();
    storedOnDataCb = null;
    storedOnResizeCb = null;
    termConstructorArgs = null;
    webglShouldThrow = false;
    container = document.createElement("div");
  });

  it("createTerminal creates xterm Terminal with correct config", async () => {
    await createTerminal(container, "session-1");

    expect(Terminal).toHaveBeenCalledOnce();
    expect(termConstructorArgs).toBeDefined();
    expect(termConstructorArgs!.fontFamily).toBe(
      DEFAULT_TERMINAL_CONFIG.fontFamily,
    );
    expect(termConstructorArgs!.fontSize).toBe(
      DEFAULT_TERMINAL_CONFIG.fontSize,
    );
    expect(termConstructorArgs!.allowProposedApi).toBe(true);
    expect(mockOpen).toHaveBeenCalledWith(container);
  });

  it("createTerminal loads FitAddon and calls fit()", async () => {
    await createTerminal(container, "session-2");

    expect(FitAddon).toHaveBeenCalledOnce();
    expect(mockLoadAddon).toHaveBeenCalled();
    expect(mockFit).toHaveBeenCalledOnce();
  });

  it("createTerminal loads WebglAddon with fallback on error", async () => {
    // First: WebGL works fine
    await createTerminal(container, "session-3a");

    const { WebglAddon } = await import("@xterm/addon-webgl");
    expect(WebglAddon).toHaveBeenCalled();

    // Reset for fallback test
    vi.clearAllMocks();
    webglShouldThrow = true;

    // Should NOT throw -- falls back to DOM renderer
    const handle = await createTerminal(container, "session-3b");
    expect(handle).toBeDefined();
    expect(handle.terminal).toBeDefined();
  });

  it("createTerminal calls ptyOpen with correct params", async () => {
    await createTerminal(container, "session-4");

    expect(mockPtyOpen).toHaveBeenCalledOnce();
    const [params, onData] = mockPtyOpen.mock.calls[0];
    expect(params).toEqual({ id: "session-4", cols: 80, rows: 24 });
    expect(typeof onData).toBe("function");
  });

  it("user input is forwarded via ptyWrite", async () => {
    await createTerminal(container, "session-5");

    expect(storedOnDataCb).not.toBeNull();
    storedOnDataCb!("ls\r");

    expect(mockPtyWrite).toHaveBeenCalledWith("session-5", "ls\r");
  });

  it("resize events are forwarded via ptyResize", async () => {
    await createTerminal(container, "session-6");

    expect(storedOnResizeCb).not.toBeNull();
    storedOnResizeCb!({ cols: 120, rows: 40 });

    expect(mockPtyResize).toHaveBeenCalledWith("session-6", 120, 40);
  });

  it("PTY output is routed through FlowController", async () => {
    await createTerminal(container, "session-7");

    // Get the onData callback passed to ptyOpen
    const onData = mockPtyOpen.mock.calls[0][1] as (
      data: Uint8Array,
    ) => void;
    const testData = new Uint8Array([72, 101, 108, 108, 111]);
    onData(testData);

    expect(mockFlowWrite).toHaveBeenCalledWith(testData);
  });

  it("dispose() calls ptyClose and disposes terminal", async () => {
    const handle = await createTerminal(container, "session-8");

    await handle.dispose();

    expect(mockPtyClose).toHaveBeenCalledWith("session-8");
    expect(mockDispose).toHaveBeenCalledOnce();
    expect(mockDisconnect).toHaveBeenCalledOnce();
  });
});
