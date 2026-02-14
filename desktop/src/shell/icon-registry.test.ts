import { describe, it, expect } from "vitest";
import { ALL_MODULE_TYPES, ICON_REGISTRY, getIconDef } from "./icon-registry";

describe("icon-registry", () => {
  it("ALL_MODULE_TYPES contains all 5 types", () => {
    expect(ALL_MODULE_TYPES).toContain("dashboard");
    expect(ALL_MODULE_TYPES).toContain("terminal");
    expect(ALL_MODULE_TYPES).toContain("console");
    expect(ALL_MODULE_TYPES).toContain("staging");
    expect(ALL_MODULE_TYPES).toContain("settings");
    expect(ALL_MODULE_TYPES).toHaveLength(5);
  });

  it("ICON_REGISTRY has entry for every module type", () => {
    for (const type of ALL_MODULE_TYPES) {
      expect(ICON_REGISTRY.get(type)).toBeDefined();
    }
  });

  it("each icon has a valid 8x8 bitmap", () => {
    for (const [, def] of ICON_REGISTRY) {
      expect(def.bitmap).toHaveLength(8);
      for (const row of def.bitmap) {
        expect(row).toBeGreaterThanOrEqual(0);
        expect(row).toBeLessThanOrEqual(255);
      }
    }
  });

  it("each icon has a non-empty label", () => {
    for (const [, def] of ICON_REGISTRY) {
      expect(def.label.length).toBeGreaterThan(0);
    }
  });

  it("each icon has valid defaultBounds", () => {
    for (const [, def] of ICON_REGISTRY) {
      expect(def.defaultBounds.width).toBeGreaterThanOrEqual(200);
      expect(def.defaultBounds.height).toBeGreaterThanOrEqual(150);
    }
  });

  it("getIconDef returns definition for known types", () => {
    const def = getIconDef("dashboard");
    expect(def).toBeDefined();
    expect(def!.type).toBe("dashboard");
  });

  it("getIconDef returns undefined for unknown type", () => {
    const def = getIconDef("unknown" as any);
    expect(def).toBeUndefined();
  });

  it("dashboard icon label is 'Dashboard'", () => {
    const def = getIconDef("dashboard");
    expect(def!.label).toBe("Dashboard");
  });

  it("terminal icon label is 'Terminal'", () => {
    const def = getIconDef("terminal");
    expect(def!.label).toBe("Terminal");
  });

  it("console icon label is 'Console'", () => {
    const def = getIconDef("console");
    expect(def!.label).toBe("Console");
  });

  it("staging icon label is 'Staging'", () => {
    const def = getIconDef("staging");
    expect(def!.label).toBe("Staging");
  });

  it("settings icon label is 'Settings'", () => {
    const def = getIconDef("settings");
    expect(def!.label).toBe("Settings");
  });

  it("icon bitmaps are visually distinct", () => {
    const bitmaps = new Set<string>();
    for (const [, def] of ICON_REGISTRY) {
      const key = JSON.stringify(def.bitmap);
      expect(bitmaps.has(key)).toBe(false);
      bitmaps.add(key);
    }
  });
});
