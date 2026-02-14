import { describe, it, expect, vi } from "vitest";
import { FlowController, TerminalWriter } from "./flow-control";
import { CALLBACK_BYTE_LIMIT, HIGH_WATERMARK, LOW_WATERMARK } from "./types";

/** Create a mock terminal with controllable write callbacks */
function createMockTerminal() {
  const pendingCallbacks: Array<() => void> = [];
  const writeCalls: Array<{ data: Uint8Array | string; hasCallback: boolean }> =
    [];

  const term: TerminalWriter = {
    write(data: Uint8Array | string, callback?: () => void) {
      writeCalls.push({ data, hasCallback: !!callback });
      if (callback) {
        pendingCallbacks.push(callback);
      }
    },
  };

  return { term, writeCalls, pendingCallbacks };
}

describe("FlowController", () => {
  it("writes data to terminal without callback when under byte limit", () => {
    const { term, writeCalls } = createMockTerminal();
    const onPause = vi.fn();
    const onResume = vi.fn();
    const fc = new FlowController(term, onPause, onResume);

    // Write a small chunk well under CALLBACK_BYTE_LIMIT (100KB)
    const chunk = new Uint8Array(1024);
    fc.write(chunk);

    expect(writeCalls).toHaveLength(1);
    expect(writeCalls[0].hasCallback).toBe(false);
    expect(fc.getState().paused).toBe(false);
  });

  it("attaches callback when written bytes exceed CALLBACK_BYTE_LIMIT", () => {
    const { term, writeCalls } = createMockTerminal();
    const onPause = vi.fn();
    const onResume = vi.fn();
    const fc = new FlowController(term, onPause, onResume);

    // Write enough data to cross the 100KB threshold
    const chunk = new Uint8Array(CALLBACK_BYTE_LIMIT + 1);
    fc.write(chunk);

    expect(writeCalls).toHaveLength(1);
    expect(writeCalls[0].hasCallback).toBe(true);
  });

  it("triggers pause when pending callbacks exceed HIGH_WATERMARK", () => {
    const { term } = createMockTerminal();
    const onPause = vi.fn();
    const onResume = vi.fn();
    const fc = new FlowController(term, onPause, onResume);

    // Write enough chunks to accumulate HIGH_WATERMARK + 1 pending callbacks
    const chunk = new Uint8Array(CALLBACK_BYTE_LIMIT + 1);
    for (let i = 0; i < HIGH_WATERMARK + 1; i++) {
      fc.write(chunk);
    }

    expect(onPause).toHaveBeenCalledTimes(1);
    expect(fc.getState().paused).toBe(true);
  });

  it("triggers resume when callbacks drain below LOW_WATERMARK", () => {
    const { term, pendingCallbacks } = createMockTerminal();
    const onPause = vi.fn();
    const onResume = vi.fn();
    const fc = new FlowController(term, onPause, onResume);

    // Build up enough pending callbacks to trigger pause
    const chunk = new Uint8Array(CALLBACK_BYTE_LIMIT + 1);
    for (let i = 0; i < HIGH_WATERMARK + 1; i++) {
      fc.write(chunk);
    }
    expect(fc.getState().paused).toBe(true);

    // Resolve callbacks until below LOW_WATERMARK
    // We have HIGH_WATERMARK + 1 = 6 pending, need to resolve enough to get below LOW_WATERMARK (2)
    // Resolve 5 of them (leaving 1, which is < 2)
    const toResolve =
      pendingCallbacks.length - (LOW_WATERMARK - 1);
    for (let i = 0; i < toResolve; i++) {
      pendingCallbacks[i]();
    }

    expect(onResume).toHaveBeenCalledTimes(1);
    expect(fc.getState().paused).toBe(false);
  });

  it("does not trigger resume when still above LOW_WATERMARK", () => {
    const { term, pendingCallbacks } = createMockTerminal();
    const onPause = vi.fn();
    const onResume = vi.fn();
    const fc = new FlowController(term, onPause, onResume);

    // Build up pending callbacks to trigger pause
    const chunk = new Uint8Array(CALLBACK_BYTE_LIMIT + 1);
    for (let i = 0; i < HIGH_WATERMARK + 1; i++) {
      fc.write(chunk);
    }
    expect(fc.getState().paused).toBe(true);

    // Resolve only 2 callbacks (leaving 4, which is >= LOW_WATERMARK)
    pendingCallbacks[0]();
    pendingCallbacks[1]();

    expect(onResume).not.toHaveBeenCalled();
    expect(fc.getState().paused).toBe(true);
  });

  it("resets written counter after attaching callback", () => {
    const { term } = createMockTerminal();
    const onPause = vi.fn();
    const onResume = vi.fn();
    const fc = new FlowController(term, onPause, onResume);

    // Write a chunk that crosses the byte limit
    const chunk = new Uint8Array(CALLBACK_BYTE_LIMIT + 1);
    fc.write(chunk);

    // After callback attachment, written should be reset to 0
    expect(fc.getState().written).toBe(0);
  });

  it("exposes flow state via getState()", () => {
    const { term } = createMockTerminal();
    const onPause = vi.fn();
    const onResume = vi.fn();
    const fc = new FlowController(term, onPause, onResume);

    const state = fc.getState();
    expect(state).toEqual({
      paused: false,
      pendingCallbacks: 0,
      written: 0,
    });

    // Write some data (under limit)
    const chunk = new Uint8Array(500);
    fc.write(chunk);

    const state2 = fc.getState();
    expect(state2.written).toBe(500);
    expect(state2.paused).toBe(false);
    expect(state2.pendingCallbacks).toBe(0);
  });
});
