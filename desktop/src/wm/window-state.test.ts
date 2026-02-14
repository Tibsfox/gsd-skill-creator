import { describe, it, expect } from "vitest";
import { createWindow, updateBounds, minimizeWindow, restoreWindow } from "./window-state";
import {
  DEFAULT_WINDOW_BOUNDS,
  MIN_WINDOW_WIDTH,
  MIN_WINDOW_HEIGHT,
} from "./types";
import type { WindowState } from "./types";

describe("createWindow", () => {
  it("uses default bounds when none provided", () => {
    const win = createWindow({ id: "win-1", type: "dashboard", title: "Dashboard" });

    expect(win.id).toBe("win-1");
    expect(win.type).toBe("dashboard");
    expect(win.title).toBe("Dashboard");
    expect(win.bounds).toEqual(DEFAULT_WINDOW_BOUNDS);
    expect(win.minimized).toBe(false);
    expect(win.restoreBounds).toBeNull();
  });

  it("merges partial bounds with defaults", () => {
    const win = createWindow({
      id: "win-2",
      type: "terminal",
      title: "Terminal",
      bounds: { x: 100, y: 200 },
    });

    expect(win.bounds).toEqual({
      x: 100,
      y: 200,
      width: DEFAULT_WINDOW_BOUNDS.width,
      height: DEFAULT_WINDOW_BOUNDS.height,
    });
  });

  it("uses full custom bounds when all fields provided", () => {
    const bounds = { x: 10, y: 20, width: 800, height: 600 };
    const win = createWindow({
      id: "win-3",
      type: "console",
      title: "Console",
      bounds,
    });

    expect(win.bounds).toEqual(bounds);
  });
});

describe("updateBounds", () => {
  const base: WindowState = {
    id: "win-1",
    type: "dashboard",
    title: "Dashboard",
    bounds: { x: 50, y: 50, width: 640, height: 480 },
    minimized: false,
    restoreBounds: null,
  };

  it("changes position", () => {
    const updated = updateBounds(base, { x: 300, y: 400 });

    expect(updated.bounds.x).toBe(300);
    expect(updated.bounds.y).toBe(400);
    expect(updated.bounds.width).toBe(640);
    expect(updated.bounds.height).toBe(480);
  });

  it("changes size", () => {
    const updated = updateBounds(base, { width: 800 });

    expect(updated.bounds.width).toBe(800);
    expect(updated.bounds.height).toBe(480);
    expect(updated.bounds.x).toBe(50);
    expect(updated.bounds.y).toBe(50);
  });

  it("clamps to minimum dimensions", () => {
    const updated = updateBounds(base, { width: 50, height: 30 });

    expect(updated.bounds.width).toBe(MIN_WINDOW_WIDTH);
    expect(updated.bounds.height).toBe(MIN_WINDOW_HEIGHT);
  });
});

describe("minimizeWindow", () => {
  const base: WindowState = {
    id: "win-1",
    type: "dashboard",
    title: "Dashboard",
    bounds: { x: 50, y: 50, width: 640, height: 480 },
    minimized: false,
    restoreBounds: null,
  };

  it("sets minimized and saves restoreBounds", () => {
    const minimized = minimizeWindow(base);

    expect(minimized.minimized).toBe(true);
    expect(minimized.restoreBounds).toEqual(base.bounds);
  });

  it("is no-op on already minimized window", () => {
    const alreadyMinimized: WindowState = {
      ...base,
      minimized: true,
      restoreBounds: { x: 10, y: 10, width: 400, height: 300 },
    };
    const result = minimizeWindow(alreadyMinimized);

    expect(result).toBe(alreadyMinimized);
  });
});

describe("restoreWindow", () => {
  it("clears minimized and restores bounds", () => {
    const savedBounds = { x: 100, y: 100, width: 500, height: 400 };
    const minimized: WindowState = {
      id: "win-1",
      type: "dashboard",
      title: "Dashboard",
      bounds: { x: 0, y: 0, width: 0, height: 0 },
      minimized: true,
      restoreBounds: savedBounds,
    };
    const restored = restoreWindow(minimized);

    expect(restored.minimized).toBe(false);
    expect(restored.bounds).toEqual(savedBounds);
    expect(restored.restoreBounds).toBeNull();
  });

  it("is no-op on non-minimized window", () => {
    const normal: WindowState = {
      id: "win-1",
      type: "dashboard",
      title: "Dashboard",
      bounds: { x: 50, y: 50, width: 640, height: 480 },
      minimized: false,
      restoreBounds: null,
    };
    const result = restoreWindow(normal);

    expect(result).toBe(normal);
  });
});
