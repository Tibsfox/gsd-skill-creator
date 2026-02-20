import { describe, it, expect } from "vitest";
import type { WindowType, WindowState, WindowBounds, CreateWindowOptions } from "./types";
import {
  MIN_WINDOW_WIDTH,
  MIN_WINDOW_HEIGHT,
  DEFAULT_WINDOW_BOUNDS,
} from "./types";

describe("WindowType", () => {
  it("accepts 'knowledge' as a valid window type", () => {
    const wt: WindowType = "knowledge";
    expect(wt).toBe("knowledge");
  });

  it("accepts all original window types", () => {
    const types: WindowType[] = [
      "dashboard",
      "terminal",
      "console",
      "staging",
      "settings",
      "aminet",
      "knowledge",
    ];
    expect(types).toHaveLength(7);
  });

  it("can be used in a WindowState", () => {
    const state: WindowState = {
      id: "win-knowledge-1",
      type: "knowledge",
      title: "Knowledge Packs",
      bounds: { ...DEFAULT_WINDOW_BOUNDS },
      minimized: false,
      restoreBounds: null,
    };
    expect(state.type).toBe("knowledge");
  });

  it("can be used in CreateWindowOptions", () => {
    const opts: CreateWindowOptions = {
      id: "win-knowledge-2",
      type: "knowledge",
      title: "Knowledge Browser",
    };
    expect(opts.type).toBe("knowledge");
  });
});

describe("WindowBounds constants", () => {
  it("MIN_WINDOW_WIDTH is a positive number", () => {
    expect(MIN_WINDOW_WIDTH).toBeGreaterThan(0);
  });

  it("MIN_WINDOW_HEIGHT is a positive number", () => {
    expect(MIN_WINDOW_HEIGHT).toBeGreaterThan(0);
  });

  it("DEFAULT_WINDOW_BOUNDS has all required properties", () => {
    expect(DEFAULT_WINDOW_BOUNDS).toHaveProperty("x");
    expect(DEFAULT_WINDOW_BOUNDS).toHaveProperty("y");
    expect(DEFAULT_WINDOW_BOUNDS).toHaveProperty("width");
    expect(DEFAULT_WINDOW_BOUNDS).toHaveProperty("height");
  });
});
