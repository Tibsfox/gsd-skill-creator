import { describe, it, expect } from "vitest";
import type {
  PixelBitmap,
  DesktopIconDef,
  ProcessStatus,
  TaskbarEntry,
  MenuItem,
  KeyBinding,
} from "./types";

describe("shell types", () => {
  it("PixelBitmap is a tuple of 8 numbers", () => {
    const bitmap: PixelBitmap = [0, 1, 2, 3, 4, 5, 6, 7];
    expect(bitmap).toHaveLength(8);
    for (const row of bitmap) {
      expect(typeof row).toBe("number");
    }
  });

  it("DesktopIconDef has all required fields", () => {
    const def: DesktopIconDef = {
      type: "dashboard",
      label: "Dashboard",
      bitmap: [0, 0, 0, 0, 0, 0, 0, 0],
      defaultBounds: { x: 0, y: 0, width: 640, height: 480 },
    };
    expect(def.type).toBe("dashboard");
    expect(def.label).toBe("Dashboard");
    expect(def.bitmap).toHaveLength(8);
    expect(def.defaultBounds.width).toBe(640);
    expect(def.defaultBounds.height).toBe(480);
  });

  it("ProcessStatus covers all states", () => {
    const running: ProcessStatus = "running";
    const paused: ProcessStatus = "paused";
    const idle: ProcessStatus = "idle";
    const stopped: ProcessStatus = "stopped";
    const error: ProcessStatus = "error";
    expect(running).toBe("running");
    expect(paused).toBe("paused");
    expect(idle).toBe("idle");
    expect(stopped).toBe("stopped");
    expect(error).toBe("error");
  });

  it("TaskbarEntry has all fields", () => {
    const entry: TaskbarEntry = {
      windowId: "win-1",
      type: "terminal",
      title: "Terminal",
      minimized: false,
      focused: true,
    };
    expect(entry.windowId).toBe("win-1");
    expect(entry.type).toBe("terminal");
    expect(entry.title).toBe("Terminal");
    expect(entry.minimized).toBe(false);
    expect(entry.focused).toBe(true);
  });

  it("MenuItem with optional fields", () => {
    const minimal: MenuItem = {
      id: "save",
      label: "Save",
      action: () => {},
    };
    expect(minimal.id).toBe("save");
    expect(minimal.label).toBe("Save");
    expect(minimal.shortcut).toBeUndefined();
    expect(minimal.separator).toBeUndefined();

    const full: MenuItem = {
      id: "quit",
      label: "Quit",
      shortcut: "Ctrl+Q",
      action: () => {},
      separator: true,
      disabled: false,
    };
    expect(full.shortcut).toBe("Ctrl+Q");
    expect(full.separator).toBe(true);
  });

  it("KeyBinding with modifier combinations", () => {
    const binding: KeyBinding = {
      key: "s",
      ctrl: true,
      alt: true,
      action: "save-all",
      handler: () => {},
    };
    expect(binding.key).toBe("s");
    expect(binding.ctrl).toBe(true);
    expect(binding.alt).toBe(true);
    expect(binding.shift).toBeUndefined();
    expect(binding.action).toBe("save-all");
  });
});
